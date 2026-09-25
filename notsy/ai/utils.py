from langchain.text_splitter import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import pandas as pd
import requests
import tiktoken
import tempfile
import uuid
import json
import os
import time
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(os.path.dirname(BASE_DIR), '.env'))

def load_reference_data(filename, columns):
    path = os.path.join(BASE_DIR, filename)
    if os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame(columns=columns)


OPENAI_DF = load_reference_data('openai_docs_chunked.csv', ['id', 'text'])
GFG_DF = load_reference_data('gfg_cleaned.csv', ['url', 'text'])

class GeminiRateLimitError(RuntimeError):
    def __init__(self, retry_after_seconds=None):
        self.retry_after_seconds = retry_after_seconds
        if retry_after_seconds:
            minutes = max(1, round(retry_after_seconds / 60))
            message = f'Gemini free-tier quota reached. Please wait about {minutes} minute(s) and try again.'
        else:
            message = 'Gemini free-tier quota reached. Please wait and try again later.'
        super().__init__(message)


    generation_retry_until = 0


class GeminiResponse:
    def __init__(self, output_text):
        self.output_text = output_text


class GeminiEmbeddings:
    def __init__(self, api_key, model):
        self.api_key = api_key
        self.model = model

    def create(self, input, model=None):
        embeddings = []
        for text in input:
            url = f'https://generativelanguage.googleapis.com/v1beta/models/{model or self.model}:embedContent'
            response = requests.post(
                url,
                params={'key': self.api_key},
                json={
                    'content': {'parts': [{'text': text.replace('\n', ' ')}]},
                    'outputDimensionality': 3072,
                },
                timeout=60,
            )
            if not response.ok:
                raise RuntimeError(
                    f'Gemini embedding request failed ({response.status_code}): '
                    f'{response.text[:500]}'
                )
            embeddings.append(type('Embedding', (), {
                'embedding': response.json()['embedding']['values']
            })())
        return type('EmbeddingResponse', (), {'data': embeddings})()


class GeminiResponses:
    def __init__(self, api_key, default_model):
        self.api_key = api_key
        self.default_model = default_model

    def create(self, model=None, input=None, text=None, temperature=None, max_output_tokens=None):
        global generation_retry_until
        remaining = generation_retry_until - time.time()
        if remaining > 0:
            raise GeminiRateLimitError(remaining)

        contents = input if isinstance(input, list) else [{'role': 'user', 'content': input or ''}]
        system_instruction = None
        parts = []
        for message in contents:
            role = message.get('role', 'user')
            content = message.get('content', '')
            if isinstance(content, list):
                content = '\n'.join(str(part.get('text', part)) for part in content)
            if role == 'developer' or role == 'system':
                system_instruction = {'parts': [{'text': str(content)}]}
            else:
                parts.append({'text': str(content)})

        generation_config = {}
        if temperature is not None:
            generation_config['temperature'] = temperature
        if max_output_tokens is not None:
            generation_config['maxOutputTokens'] = max_output_tokens
        if text and text.get('format', {}).get('type') == 'json_schema':
            generation_config['responseMimeType'] = 'application/json'
            generation_config['responseSchema'] = self._gemini_schema(text['format']['schema'])

        payload = {'contents': [{'role': 'user', 'parts': parts}]}
        if system_instruction:
            payload['systemInstruction'] = system_instruction
        if generation_config:
            payload['generationConfig'] = generation_config

        selected_model = model or self.default_model
        if selected_model.startswith('gpt-'):
            selected_model = self.default_model
        for attempt in range(3):
            response = requests.post(
                f'https://generativelanguage.googleapis.com/v1beta/models/{selected_model}:generateContent',
                params={'key': self.api_key},
                json=payload,
                timeout=180,
            )
            if response.status_code == 429:
                break
            if response.status_code not in (500, 502, 503, 504) or attempt == 2:
                break
            time.sleep(2 ** attempt)
        if not response.ok:
            if response.status_code == 429:
                match = re.search(r'retry in ([0-9.]+)s', response.text, re.IGNORECASE)
                retry_after = float(match.group(1)) if match else None
                generation_retry_until = time.time() + (retry_after or 60)
                raise GeminiRateLimitError(retry_after)
            raise RuntimeError(
                f'Gemini generation failed ({response.status_code}): {response.text[:500]}'
            )
        candidates = response.json().get('candidates', [])
        if not candidates:
            raise RuntimeError('Gemini returned no candidates')
        output_text = ''.join(
            part.get('text', '') for part in candidates[0].get('content', {}).get('parts', [])
        )
        return GeminiResponse(output_text)

    def _gemini_schema(self, schema):
        if isinstance(schema, dict):
            converted = {
                key: self._gemini_schema(value)
                for key, value in schema.items()
                if key not in ('additionalProperties', 'strict')
            }
            if isinstance(converted.get('type'), str):
                converted['type'] = converted['type'].upper()
            return converted
        if isinstance(schema, list):
            return [self._gemini_schema(value) for value in schema]
        return schema


class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise RuntimeError('GEMINI_API_KEY is not configured')
        model = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
        embedding_model = os.getenv('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001')
        self.responses = GeminiResponses(self.api_key, model)
        self.embeddings = GeminiEmbeddings(self.api_key, embedding_model)


def initialize_openai_client():
    return GeminiClient()

def initialize_pincone():
    pine_key = os.getenv('PINE_API_KEY')
    host = os.getenv('PINE_HOST', '').strip().removeprefix('https://').removeprefix('http://').rstrip('/')
    if not pine_key or pine_key.startswith('your_'):
        raise RuntimeError('PINE_API_KEY is missing or still uses the placeholder value')
    if not host or host.startswith('your_'):
        raise RuntimeError('PINE_HOST is missing or still uses the placeholder value')
    pc = Pinecone(api_key=pine_key)
    index = pc.Index(host=host)
    return index 

def get_embedding(client, text, model=None):
    text = text.replace("\n", " ")
    return client.embeddings.create(input = [text], model=model).data[0].embedding

def create_chunks(text):
    encoding = tiktoken.encoding_for_model("text-embedding-3-large")
    tokens = encoding.encode(text)
    data=[]
    if(len(tokens)> 8180):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=8180,
            chunk_overlap=200,
        )
        chunks = text_splitter.split_text(text)
        for i, chunk in enumerate(chunks):
            data.append(chunk)  
    else:
        data.append(text)
    return data

def upsert_text(text, metadata, namespace):
    # This function is used to upsert a Single string of text to Pinecone
    chunks = create_chunks(text)
    client = initialize_openai_client()
    index = initialize_pincone()

    if 'topic_id' not in metadata: 
        raise ValueError("topic_id not found in metadata")
    if 'user_id' not in metadata: 
        raise ValueError("user_id not found in metadata")

    for i, text in enumerate(chunks):
        try:
            # Generate a unique ID using UUID
            unique_id = str(uuid.uuid4())
            vector = {
                'id': f"vec-{metadata['topic_id']}-{metadata['url']}-{unique_id}",
                'values': get_embedding(client=client, text=text),
                'metadata': metadata
            }
            index.upsert(vectors=[vector], namespace=namespace)
        except Exception as e:
            raise Exception(f"Error in upserting data to Pinecone: {str(e)}")

def query(text, namespace, top_k):
    threshold = 0.0
    index = initialize_pincone()

    # Step 1: Chunk text based on size
    data_chunks = create_chunks(text)
    if not data_chunks:
        raise ValueError("No chunks returned from the input text. Check 'create_chunks()' logic.")
    data = data_chunks[0]

    # Step 2: Get vector
    vector = get_embedding(client=initialize_openai_client(), text=data)

    # Step 3: Query Pinecone
    answer = index.query(
        vector=vector,
        top_k=top_k,
        include_metadata=True,
        namespace=namespace
    )

    result = []
    matches = answer.get("matches", [])
    if not matches:
        return result

    for match in matches:
        score = match.get("score", 0)
        if score < threshold:
            continue

        metadata = match.get("metadata", {})
        if namespace == 'openai-ref':
            id = match.get("id")
            content_row = OPENAI_DF[OPENAI_DF['id'] == id]
            if content_row.empty:
                continue
            content = content_row['text'].values[0]
            result.append({"content": content, "metadata": metadata})

        elif namespace == 'gfg':
            url = metadata.get("url")
            content_row = GFG_DF[GFG_DF['url'] == url]
            if content_row.empty:
                continue
            content = content_row['text'].values[0]
            result.append({"content": content, "metadata": metadata})

        else:
            content = metadata.get("text", "")
            result.append({"content": content, "metadata": metadata})

    return result

def clean_messages_for_gpt(messages):
    return [{"role": msg["role"], "content": msg["content"]} for msg in messages if "role" in msg and "content" in msg]

def moded_query(text, mode, user_id, topic_id):
    # Include the active topic's uploaded resources in every chat mode.
    context = []
    i = 1
    try:
        if user_id and topic_id:
            resource_results = query(text, user_id, 5)
            filtered_resources = [
                doc for doc in resource_results
                if doc.get("metadata", {}).get("topic_id") == topic_id
            ]
            for doc in filtered_resources:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[Uploaded resource #{i}] {content}"})
                i += 1

        if mode == "0":
            # Default Mode
            academic_rag_results = query(text, "gfg", 2)
            for doc in academic_rag_results:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[RAG #{i}] {content}"})
                i+=1
        elif mode == "1":
            # Dev mode
            dev_rag_results = query(text, 'dev', 3)
            for doc in dev_rag_results:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[RAG #{i}] {content}"})
                i+=1
            openai_rag_results = query(text, "openai-ref", 3)
            for doc in openai_rag_results:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[RAG #{i}] {content}"})
                i+=1
        elif mode == "2":
            # Master This
            mega_rag_results = query(text, "gfg", 3)
            for doc in mega_rag_results:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[RAG #{i}] {content}"})
                i+=1
        elif mode == "4":
            #Last Minute
            last_minute_rag_results = query(text, "gfg", 3)
            for doc in last_minute_rag_results:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[RAG #{i}] {content}"})
                i+=1
        elif mode == "5":
            # Uploaded resources were added above for every mode.
            pass
    except Exception as e:
        raise Exception(f"Error in querying data from pinecone: {str(e)}")
    return context

# 0: Default (Balanced)
# 1: Dev mode
# 2: Master This
# 3: Go crazy
# 4: Last minute
# 5: chat with pdf/video

def get_response(input,max_tokens=-1, temp=-1 ,model="gpt-4.1"):
    client = initialize_openai_client()
    req_data = {
        "model": model,
        "input": input
    }
    if temp != -1:
        req_data["temperature"] = temp
    if max_tokens != -1:
        req_data["max_output_tokens"] = max_tokens
    try:
        response = client.responses.create(**req_data)
    except Exception as e:
        if isinstance(e, GeminiRateLimitError):
            raise
        raise Exception(f"Error in getting response from OpenAI: {str(e)}")
    return response

def noteGenerator(context, model="gpt-4.1"):
    client = initialize_openai_client()
    summary = client.responses.create(
        model=model,
        input=context,
        text={
            "format": {
                "type": "json_schema",
                "name": "generate_revision_notes",
                "schema": {
                    "type": "object",
                    "properties": {
                        "title": { "type": "string"},
                        "introduction": { "type": "string" },
                        "core_concepts": {
                            "type": "array",
                            "items": { "type": "string", "description": "Detailed explanation of core concept of the topic"}
                        },
                        "example_or_use_case": { "type": "string", "description": "Example or use case of the topic, Fill it only if you some good examples otherwise leave it empty" },
                        "common_confusions": {
                            "type": "array",
                            "items": { "type": "string", "description": "Common confusions/pitfalls students fall into, Fill it only if you something important otherwise leave it empty" }
                        },
                        "memory_tips": { "type": "string" , "description": "Memory tips to remember the topic, Fill it only if you some good tip otherwise leave it empty" }
                    },
                    "required": ["title", "introduction", "core_concepts", "example_or_use_case", "common_confusions", "memory_tips"],
                    "additionalProperties": False
                },
                "strict": True
            }
        }
    )
    try:
        return json.loads(summary.output_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in model response: {summary.output_text[:200]}...") from e

def flashcardGenerator(context, model="gpt-4.1"):
    client = initialize_openai_client()
    response = client.responses.create(
        model=model,
        input=context,
        text={
            "format": {
                "type": "json_schema",
                "name": "generate_flashcards",
                "schema": {
                    "type": "object",
                    "properties": {
                        "topic": { "type": "string" },
                        "flashcards": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "concept": {
                                        "type": "string",
                                        "description": "A concise fact, formula, or concept relevant to the topic"
                                    },
                                    "explanation": {
                                        "type": "string",
                                        "description": "A short explanation, use-case, or memory aid for the concept"
                                    },
                                    "color": {
                                        "type": "string",
                                        "enum": ["red", "yellow", "green"],
                                        "description": "Importance level: red = critical, yellow = important, green = regular"
                                    }
                                },
                                "required": ["concept", "explanation", "color"],
                                "additionalProperties": False
                            }
                        }
                    },
                    "required": ["topic", "flashcards"],
                    "additionalProperties": False
                },
                "strict": True
            }
        }
    )
    try:
        return json.loads(response.output_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in model response: {response.output_text[:200]}...") from e

def quizGenerator(context, model="gpt-4.1"):
    client = initialize_openai_client()
    response = client.responses.create(
        model=model,
        input=context,
        text={
            "format": {
                "type": "json_schema",
                "name": "generate_progressive_quiz",
                "schema": {
                    "type": "object",
                    "properties": {
                        "topic": { "type": "string" },
                        "questions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "question": {
                                        "type": "string",
                                        "description": "A single multiple-choice or short-answer style question that tests knowledge of the topic"
                                    },
                                    "answer": {
                                        "type": "string",
                                        "description": "The correct answer or explanation"
                                    },
                                    "color": {
                                        "type": "string",
                                        "enum": ["green", "yellow", "red"],
                                        "description": "Difficulty level: green = easy, yellow = medium, red = hard/tricky"
                                    }
                                },
                                "required": ["question", "answer", "color"],
                                "additionalProperties": False
                            }
                        }
                    },
                    "required": ["topic", "questions"],
                    "additionalProperties": False
                },
                "strict": True
            }
        }
    )
    try:
        return json.loads(response.output_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in model response: {response.output_text[:200]}...") from e

def summarize(client, text):
    summary = client.responses.create(
        model="gpt-4o-mini",
        input=[
            {
                "role": "developer",
                "content": "You are an Text Summarizer, I will give you a conversation between an llm and a user, you need to summarize the conversation such that the summary can be used as a prompt for the llm. You must do it in a chat format so that the summary reflects the doubts of the user and solutions provided by the llm."
            },
            {
                "role": "user",
                "content": text
            },
        ],
        max_output_tokens=5000,
        temperature=0.5,   
    )
    return summary

def get_pdf_text(file):
    try:
        reader = PdfReader(file)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted
        if not text.strip():
            raise ValueError('PDF contains no extractable text; scanned PDFs require OCR')
        return text
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")