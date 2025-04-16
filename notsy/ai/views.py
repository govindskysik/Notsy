from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from . import utils
import os

# client = utils.initialize_openai_client()

# Create your views here.

class helloWorldView(APIView):
    def get(self, request):
        return Response({"message": "Hello, Got it!"}, status=status.HTTP_200_OK)
    def post(self, request):
        return Response({"message": "Hello, Posted"}, status=status.HTTP_200_OK)
    
class respond(APIView):
    # Get from students RAG, Normal Response nothing else
    def post(self, request):
        messages = request.data.get('messages')
        summary = request.data.get('summary')
        user_query = request.data.get('user_query')
        if messages is None or summary is None:
            return Response({"error": "No messages provided"}, status=status.HTTP_400_BAD_REQUEST)
        if len(messages)%2 != 0:
            return Response({"error": "Odd number of messages provided. This is not possible every user message must be followed by assistants response"}, status=status.HTTP_400_BAD_REQUEST)
        if user_query is None:
            return Response({"error": "No user querry provided by the user, Please ask a question for assistant to respond"}, status=status.HTTP_400_BAD_REQUEST)
        messages = utils.clean_messages_for_gpt(messages)
        instruction = { "role": "developer", "content": "You are an educational assistant for engineering students. You have to teach and help user understand it"}
        context = [instruction]
        messages_trunc = messages[-20:]
        summary_trunc = summary[:-2]
        for i in range(len(summary_trunc)):
            context.append({"role": "user", "content": f'[SUMMARY #{i+1}] {summary_trunc[i]}'})
        for i in range(0, len(messages_trunc), 2):
            user_message = messages_trunc[i]
            assistant_message = messages_trunc[i+1]
            context.append({"role": "user", "content": user_message})
            context.append({"role": "assistant", "content": assistant_message})
        context.append({"role": "user", "content": user_query})
        try:
            response = utils.get_response(context)
        except Exception as e:
            return Response({"error": f'Unable to get response from open-ai,\nError {str(e)}' }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"message": response.output_text}, status=status.HTTP_200_OK)

class augmentedRespond(APIView):
    def post(self, request):
        messages = request.data.get('messages')
        summary = request.data.get('summary')
        user_query = request.data.get('user_query')
        topic_id = request.data.get('topicId')
        user_id = request.data.get('userId')
        mode_id = request.data.get('modeId',"0")

        if messages is None or summary is None:
            return Response({"error": "No messages or summary provided."}, status=status.HTTP_400_BAD_REQUEST)
        if len(messages) % 2 != 0:
            return Response({"error": "Odd number of messages. Every user message must be followed by assistant response."}, status=status.HTTP_400_BAD_REQUEST)
        if user_query is None:
            return Response({"error": "No user query provided."}, status=status.HTTP_400_BAD_REQUEST)

        messages = utils.clean_messages_for_gpt(messages)

        # Initialize context with instruction
        instructions = {
            "0": "",
            "1": "Be very faithful to any documentation provided in the context in any.",
            "2": "",
            "3": "Help the user understand concepts and explore topics",
            "4": "You are a teacher. Help user learn and prepare the concepts for a last minute exam.",
            "5": "You are a teacher. Help the user understand the the content concepts clearly using the given context."
        }
        tempratures = {"1": 0.5, "2": 0.5, "3": 1.4}
        max_output_tokens = {"4": 5000}
        instruction = {
            "role": "developer",
            "content": instructions.get(mode_id, instructions["0"])
        }
        context = [instruction]

        # Append truncated summary
        for i, summ in enumerate(summary[:-2]):
            context.append(summ)

        # Append last 20 messages
        messages_trunc = messages[-20:]
        for i in range(0, len(messages_trunc), 2):
            context.append(messages_trunc[i])
            context.append(messages_trunc[i+1])

        metadata = {}
        try:
            # Query RAG
            rag_results = utils.moded_query(user_query, mode=mode_id, user_id=user_id, topic_id=topic_id)
            context += rag_results
        except Exception as e:
            print(f"RAG retrieval failed: {str(e)}")

        # Add user query to the end
        context.append({"role": "user", "content": user_query})

        temprature = tempratures.get(mode_id, None)
        max_tokens = max_output_tokens.get(mode_id, None)

        try:
            response = utils.get_response(context, max_tokens=max_tokens, temp=temprature)
        except Exception as e:
            return Response({"error": f"Failed to get LLM response. Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": response.output_text,
            "metadata": metadata  # First matched metadata; optional to return more
        }, status=status.HTTP_200_OK)

class makeNotes(APIView):
    def post(self, request):
        messages = request.data.get('messages')
        summary = request.data.get('summary')
        topic_id = request.data.get('topicId')
        user_id = request.data.get('userId')

        if messages is None or summary is None:
            return Response({"error": "No messages or summary provided."}, status=status.HTTP_400_BAD_REQUEST)
        if len(messages) % 2 != 0:
            return Response({"error": "Odd number of messages. Every user message must be followed by assistant response."}, status=status.HTTP_400_BAD_REQUEST)
        
        messages = utils.clean_messages_for_gpt(messages)
        context = []

        for i, summ in enumerate(summary[:-2]):
            context.append(summ)
        # Append last 20 messages
        messages_trunc = messages[-20:]
        for i in range(0, len(messages_trunc) - 1, 2):
            context.append(messages_trunc[i])
            context.append(messages_trunc[i + 1])
        mini_rag_results = utils.query("Key academic concepts", user_id, 5)
        filtered_rag = [doc for doc in mini_rag_results if doc.get("metadata", {}).get("topic_id") == topic_id]
        for j, doc in enumerate(filtered_rag):
            content = doc.get("content", "")
            context.append({"role": "system", "content": f"[RAG #{j+1}] {content}"})

        context.append({"role": "user", "content": "make detailed Notes of the topic from the above conversation and retrived content. Be very detailed, length is important."})

        try:
            notes = utils.noteGenerator(context=context)
        except Exception as e:
            return Response({"error": f'Unable to generate Notes, Error {str(e)}' }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"message": notes}, status=status.HTTP_200_OK)
    
class makeFlashCards(APIView):
    def post(self, request):
        messages = request.data.get('messages')
        summary = request.data.get('summary')
        topic_id = request.data.get('topicId')
        user_id = request.data.get('userId')

        if messages is None or summary is None:
            return Response({"error": "No messages or summary provided."}, status=status.HTTP_400_BAD_REQUEST)
        if len(messages) % 2 != 0:
            return Response({"error": "Odd number of messages. Every user message must be followed by assistant response."}, status=status.HTTP_400_BAD_REQUEST)
        
        messages = utils.clean_messages_for_gpt(messages)
        context = []

        for i, summ in enumerate(summary[:-2]):
            context.append(summ)
        # Append last 20 messages
        messages_trunc = messages[-20:]
        for i in range(0, len(messages_trunc) - 1, 2):
            context.append(messages_trunc[i])
            context.append(messages_trunc[i + 1])
        mini_rag_results = utils.query("Key academic concepts", user_id, 5)
        filtered_rag = [doc for doc in mini_rag_results if doc.get("metadata", {}).get("topic_id") == topic_id]
        for j, doc in enumerate(filtered_rag):
            content = doc.get("content", "")
            context.append({"role": "system", "content": f"[RAG #{j+1}] {content}"})

        context.append({"role": "user", "content": "Make Flash cards from the above conversation as well as the retrieved content. make meaningful flash cards that will help the student revise the topic and learn important facts and formulas for exam."})

        try:
            notes = utils.flashcardGenerator(context=context)
        except Exception as e:
            return Response({"error": f'Unable to generate Notes, Error {str(e)}' }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"message": notes}, status=status.HTTP_200_OK)
    
class makeQuizCards(APIView):
    def post(self, request):
        messages = request.data.get('messages')
        summary = request.data.get('summary')
        topic_id = request.data.get('topicId')
        user_id = request.data.get('userId')

        if messages is None or summary is None:
            return Response({"error": "No messages or summary provided."}, status=status.HTTP_400_BAD_REQUEST)
        if len(messages) % 2 != 0:
            return Response({"error": "Odd number of messages. Every user message must be followed by assistant response."}, status=status.HTTP_400_BAD_REQUEST)
        
        messages = utils.clean_messages_for_gpt(messages)
        context = []

        for i, summ in enumerate(summary[:-2]):
            context.append(summ)
        # Append last 20 messages
        messages_trunc = messages[-20:]
        for i in range(0, len(messages_trunc) - 1, 2):
            context.append(messages_trunc[i])
            context.append(messages_trunc[i + 1])
        mini_rag_results = utils.query("Key academic concepts", user_id, 5)
        filtered_rag = [doc for doc in mini_rag_results if doc.get("metadata", {}).get("topic_id") == topic_id]
        for j, doc in enumerate(filtered_rag):
            content = doc.get("content", "")
            context.append({"role": "system", "content": f"[RAG #{j+1}] {content}"})

        context.append({"role": "user", "content": "Make Quiz from the above conversation as well as the retrieved content. make meaningful quiz that will help the student practice the topic. It should be prograssively harder. Do not back if necessary, make sure the last part of the quiz is master level."})

        try:
            notes = utils.flashcardGenerator(context=context)
        except Exception as e:
            return Response({"error": f'Unable to generate Notes, Error {str(e)}' }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"message": notes}, status=status.HTTP_200_OK)

class miniRag(APIView):
    def post(self, request):
        data_type = request.data.get('type')
        source = request.data.get('source')
        content = request.data.get('content')
        topicId = request.data.get('topicId')
        userId = request.data.get('userId')
        createdAt = request.data.get('createdAt')

        if data_type is None or topicId is None or createdAt is None:
            return Response({"error": "Missing required fields: type, topicId or createdAt"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if data_type == 'pdf':
                if 'pdf' not in request.FILES:
                    return Response({"error": "No PDF files found in request"}, status=status.HTTP_400_BAD_REQUEST)

                pdf_files = request.FILES.getlist('pdf')
                for pdf_file in pdf_files:
                    try:
                        pdf_text = utils.get_pdf_text(pdf_file)
                        utils.upsert_text(
                            text=pdf_text,
                            namespace=userId,
                            metadata={
                                "text": pdf_text[:500],
                                "filename": pdf_file.name,
                                "topic_id": topicId,
                                "user_id": userId,
                                "created_at": createdAt
                            }
                        )
                    except Exception as e:
                        return Response({"error": f'Unable to Upsert uploaded PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            elif data_type == 'video':
                if source is None or content is None:
                    return Response({"error": "Missing source/content for video"}, status=status.HTTP_400_BAD_REQUEST)
                if len(source) != len(content):
                    return Response({"error": f"Length of source and content must be same for {data_type}"}, status=status.HTTP_400_BAD_REQUEST)
                for i in range(len(source)):
                    video_text = content[i]
                    try:
                        utils.upsert_text(
                            text=video_text,
                            namespace=userId,
                            metadata={
                                "text": video_text,
                                "url": source[i],
                                "topic_id": topicId,
                                "user_id": userId,
                                "created_at": createdAt
                            }
                        )
                    except Exception as e:
                        return Response({"error": f'Unable to Upsert video, Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({"error": "Invalid type provided"}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": f'Python unable to process {data_type},\nError {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": f"Successfully saved {data_type} to vector-db"}, status=status.HTTP_200_OK)
    
class query(APIView):
    def post(self, request):
        text = request.data.get('text')
        namespace = request.data.get('namespace')
        top_k = request.data.get('top_k', 3)
        if text is None or namespace is None:
            return Response({"error": "No text or namespace provided"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = utils.query(text, namespace, top_k)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f'Python unable to process {type},\nError {str(e)}' }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class modedQuery(APIView):
    def post(self, request):
        text = request.data.get('text')
        mode_id = request.data.get('modeId')
        if text is None or mode_id is None:
            return Response({"error": "No text or namespace provided"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = utils.moded_query(text,mode=mode_id, user_id=None, topic_id=None)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f'Python unable to process {type},\nError {str(e)}' }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)