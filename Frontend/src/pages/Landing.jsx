import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  CommandLineIcon,
  LinkIcon,
  PlayIcon,
  SparklesIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { assets } from "../assets/assets.js";

const workflowSteps = [
  {
    number: "01",
    title: "Drop in what you have.",
    copy: "Create a notebook, add class notes, and attach the material you want to keep close.",
    icon: BookOpenIcon,
  },
  {
    number: "02",
    title: "Break it into topics.",
    copy: "Give each idea its own home so revision material stays easy to find later.",
    icon: Squares2X2Icon,
  },
  {
    number: "03",
    title: "Ask from the source.",
    copy: "Use the assistant while your notes and resources are right there for context.",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    number: "04",
    title: "Come back prepared.",
    copy: "Turn key points into flashcards and pick up exactly where you left off.",
    icon: SparklesIcon,
  },
];

const graphNodes = [
  {
    name: "Operating systems",
    meta: "Notebook",
    x: "48%",
    y: "48%",
    type: "core",
    icon: BookOpenIcon,
  },
  {
    name: "Processes",
    meta: "Topic",
    x: "23%",
    y: "26%",
    type: "orange",
    icon: Squares2X2Icon,
  },
  {
    name: "Memory",
    meta: "Topic",
    x: "76%",
    y: "24%",
    type: "gold",
    icon: Squares2X2Icon,
  },
  {
    name: "Scheduling",
    meta: "Topic",
    x: "79%",
    y: "70%",
    type: "cool",
    icon: CommandLineIcon,
  },
  {
    name: "Deadlocks",
    meta: "Topic",
    x: "25%",
    y: "73%",
    type: "orange",
    icon: SparklesIcon,
  },
];

function ProductGraph() {
  const [selected, setSelected] = useState("Operating systems");
  return (
    <div className="landing-graph" aria-label="Example Notsy knowledge map">
      <p className="landing-map-kicker">
        <span /> Live workspace preview
      </p>
      <div className="landing-graph-canvas">
        <div className="landing-graph-orbit orbit-a" />
        <div className="landing-graph-orbit orbit-b" />
        <svg
          className="landing-graph-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className="is-connected" d="M48 48 C38 41 32 34 23 26" />
          <path className="is-connected" d="M48 48 C60 40 67 31 76 24" />
          <path className="is-connected" d="M48 48 C60 55 69 64 79 70" />
          <path className="is-connected" d="M48 48 C39 57 31 66 25 73" />
          <path className="is-lit" d="M23 26 C47 21 57 22 76 24" />
        </svg>
        {graphNodes.map(({ name, meta, x, y, type, icon: Icon }) => (
          <button
            type="button"
            key={name}
            className={`landing-graph-node ${type} ${selected === name ? "is-selected" : ""}`}
            style={{ left: x, top: y }}
            onClick={() => setSelected(name)}
          >
            <span className="landing-node-icon">
              {React.createElement(Icon)}
            </span>
            <span className="landing-node-name">{name}</span>
            <span className="landing-node-meta">{meta}</span>
          </button>
        ))}
        <div className="landing-graph-inspector">
          <span>Viewing</span>
          <strong>{selected}</strong>
          <button type="button" aria-label="Open selected topic">
            <ArrowRightIcon />
          </button>
        </div>
      </div>
      <p className="landing-map-hint">
        Select a topic to follow its connections
      </p>
    </div>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  const pageRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const goToRegister = () => navigate("/auth/register");
  const goToSignIn = () => navigate("/auth/login");
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };
  useEffect(() => {
    const sections = pageRef.current?.querySelectorAll(".landing-reveal") || [];
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={pageRef} className="cinema-page landing-page">
      <header className="cinema-header landing-header landing-reveal">
        <button
          className="brand-lockup"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span className="brand-mark">
            <img src={assets.logo} alt="" />
          </span>
          <span>NOTSY</span>
        </button>
        <nav
          className={`landing-nav-pill ${menuOpen ? "is-open" : ""}`}
          aria-label="Primary navigation"
        >
          <button
            className="active"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Home
          </button>
          <button onClick={scrollToFeatures}>How it works</button>
          <button onClick={goToSignIn}>Sign in</button>
        </nav>
        <div className="header-actions">
          <button className="landing-header-cta" onClick={goToRegister}>
            <span className="text-white">New here?</span> Sign up <ArrowRightIcon />
          </button>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <main>
        <section className="landing-hero landing-reveal">
          <div className="landing-hero-copy">
            <p className="eyebrow">
              <span /> Your study space
            </p>
            <h1>
              Know where
              <br />
              <em>everything leads.</em>
            </h1>
            <p>
              Bring notes, sources, and questions into one workspace that
              remembers how they fit together.
            </p>
            <div className="landing-hero-actions">
              <button className="button-primary" onClick={goToRegister}>
                Create your workspace <ArrowRightIcon />
              </button>
              <button
                className="landing-text-button"
                onClick={scrollToFeatures}
              >
                <PlayIcon /> Take a quick look
              </button>
            </div>
          </div>
          <ProductGraph />
        </section>
        <section className="landing-proof landing-reveal">
          <div className="landing-proof-copy">
            <p className="eyebrow">
              <span /> One connected place
            </p>
            <h2>
              Your work, <em>in motion.</em>
            </h2>
            <p>
              Notes, flashcards, questions, and sources stay in the same
              orbit—ready when you need them.
            </p>
          </div>
          <div
            className="landing-orbit"
            aria-label="Notes, flashcards, questions and sources connected"
          >
            <div className="landing-orbit-ring ring-one" />
            <div className="landing-orbit-ring ring-two" />
            <div className="landing-orbit-ring ring-three" />
            <div className="landing-orbit-ring ring-four" />
            <div className="landing-orbit-core">
              {/* <LinkIcon /> */}
              <span>Your workspace</span>
            </div>
            <span className="landing-orbit-track note">
              <span className="landing-orbit-item">
                <BookOpenIcon /> Notes
              </span>
            </span>
            <span className="landing-orbit-track cards">
              <span className="landing-orbit-item">
                <SparklesIcon /> Flashcards
              </span>
            </span>
            <span className="landing-orbit-track ask">
              <span className="landing-orbit-item">
                <ChatBubbleLeftRightIcon /> Questions
              </span>
            </span>
            <span className="landing-orbit-track source">
              <span className="landing-orbit-item">
                <LinkIcon /> Sources
              </span>
            </span>
          </div>
        </section>
        <section ref={featuresRef} className="landing-workflow landing-reveal">
          <div className="landing-workflow-intro">
            <p className="eyebrow">
              <span /> How it works
            </p>
            <h2>
              Make the
              <br />
              <em>next step obvious.</em>
            </h2>
          </div>
          <p className="landing-workflow-note">
            Start with one notebook. The workspace builds its structure as you
            add what matters.
          </p>
          <div className="landing-step-map">
            {workflowSteps.map(({ number, title, copy, icon: Icon }, index) => (
              <article
                className={`landing-step step-${index + 1}`}
                key={number}
              >
                <span className="landing-step-marker">
                  {React.createElement(Icon)}
                </span>
                <div className="landing-step-copy">
                  <span className="landing-step-number">{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-closing landing-reveal">
          <p className="eyebrow">
            <span /> Start with one note
          </p>
          <h2>
            A workspace that
            <br />
            <em>keeps up with you.</em>
          </h2>
          <p>
            Set up your first notebook and let the connections build from there.
          </p>
          <button className="button-primary" onClick={goToRegister}>
            Get started free <ArrowRightIcon />
          </button>
        </section>
      </main>
      <footer className="cinema-footer landing-footer landing-reveal">
        <div>
          <button
            className="brand-lockup"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span className="brand-mark">
              <img src={assets.logo} alt="" />
            </span>
            <span>NOTSY</span>
          </button>
          <p>A place for your notes to make sense together.</p>
        </div>
        <div className="landing-footer-links">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Home
          </button>
          <button onClick={scrollToFeatures}>How it works</button>
          <button onClick={goToRegister}>Sign in</button>
        </div>
        <div className="landing-footer-meta">
          <span>Built for focused learning</span>
          <span>© 2026 Notsy</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
