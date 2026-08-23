import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  User,
  AlertTriangle,
  Loader2,
  Trash2,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { api } from "../api";


// ============================================================
// SUGGESTED QUESTIONS
// ============================================================

const SUGGESTED_QUESTIONS = [
  "What are the symptoms of dengue?",
  "How can I prevent malaria?",
  "What are the warning signs of severe dengue?",
  "What is the difference between dengue and chikungunya?",
];


// ============================================================
// INITIAL MESSAGE
// ============================================================

const INITIAL_MESSAGE = {
  id: "initial",
  role: "assistant",
  content:
    "Hello! I'm your AI Medical Assistant. I can provide general medical information about diseases, symptoms, prevention, warning signs, and health education. I cannot diagnose conditions or prescribe medicines.",
};


// ============================================================
// MARKDOWN NORMALIZER
// ============================================================

function normalizeMarkdown(content) {
  if (typeof content !== "string") {
    return "";
  }

  return content
    // Convert HTML line breaks sometimes returned by the AI
    // into normal Markdown line breaks.
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/br>/gi, "\n")
    .trim();
}


// ============================================================
// MARKDOWN RENDERER
// ============================================================

function MedicalMarkdown({ content }) {
  const normalizedContent = normalizeMarkdown(content);

  return (
    <div
      className="
        medical-markdown
        break-words
        text-[13px]
        leading-6
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ----------------------------------------------------
          // HEADINGS
          // ----------------------------------------------------

          h1: ({ children }) => (
            <h1
              className="
                mb-3
                mt-1
                text-[18px]
                font-bold
                leading-7
                text-[#13264B]
              "
            >
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2
              className="
                mb-2.5
                mt-4
                text-[16px]
                font-bold
                leading-6
                text-[#13264B]
              "
            >
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3
              className="
                mb-2
                mt-4
                text-[14px]
                font-bold
                leading-6
                text-[#13264B]
              "
            >
              {children}
            </h3>
          ),

          // ----------------------------------------------------
          // PARAGRAPHS
          // ----------------------------------------------------

          p: ({ children }) => (
            <p
              className="
                mb-3
                last:mb-0
              "
            >
              {children}
            </p>
          ),

          // ----------------------------------------------------
          // BOLD / ITALIC
          // ----------------------------------------------------

          strong: ({ children }) => (
            <strong className="font-bold text-[#13264B]">
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em className="italic">
              {children}
            </em>
          ),

          // ----------------------------------------------------
          // UNORDERED LIST
          // ----------------------------------------------------

          ul: ({ children }) => (
            <ul
              className="
                mb-3
                ml-5
                list-disc
                space-y-1
              "
            >
              {children}
            </ul>
          ),

          // ----------------------------------------------------
          // ORDERED LIST
          // ----------------------------------------------------

          ol: ({ children }) => (
            <ol
              className="
                mb-3
                ml-5
                list-decimal
                space-y-1
              "
            >
              {children}
            </ol>
          ),

          // ----------------------------------------------------
          // LIST ITEM
          // ----------------------------------------------------

          li: ({ children }) => (
            <li className="pl-1">
              {children}
            </li>
          ),

          // ----------------------------------------------------
          // LINKS
          // ----------------------------------------------------

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="
                font-medium
                text-[#0B7A33]
                underline
                underline-offset-2
              "
            >
              {children}
            </a>
          ),

          // ----------------------------------------------------
          // INLINE CODE
          // ----------------------------------------------------

          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code
                  className="
                    rounded
                    bg-[#F1F3F5]
                    px-1.5
                    py-0.5
                    font-mono
                    text-[12px]
                    text-[#13264B]
                  "
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className="
                  block
                  overflow-x-auto
                  rounded-lg
                  bg-[#F4F5F7]
                  p-3
                  font-mono
                  text-[12px]
                  leading-5
                  text-[#25364D]
                "
              >
                {children}
              </code>
            );
          },

          // ----------------------------------------------------
          // BLOCKQUOTE
          // ----------------------------------------------------

          blockquote: ({ children }) => (
            <blockquote
              className="
                my-3
                border-l-4
                border-[#C9D8CC]
                bg-[#F7FBF8]
                px-3
                py-2
                text-[#526173]
              "
            >
              {children}
            </blockquote>
          ),

          // ----------------------------------------------------
          // HORIZONTAL RULE
          // ----------------------------------------------------

          hr: () => (
            <hr
              className="
                my-4
                border-[#E7E2D8]
              "
            />
          ),

          // ----------------------------------------------------
          // TABLE
          // ----------------------------------------------------

          table: ({ children }) => (
            <div
              className="
                my-3
                w-full
                overflow-x-auto
                rounded-lg
                border
                border-[#E1DDD5]
              "
            >
              <table
                className="
                  w-full
                  min-w-[520px]
                  border-collapse
                  text-left
                  text-[12px]
                  leading-5
                "
              >
                {children}
              </table>
            </div>
          ),

          // ----------------------------------------------------
          // TABLE HEADER
          // ----------------------------------------------------

          thead: ({ children }) => (
            <thead className="bg-[#F5F7F4]">
              {children}
            </thead>
          ),

          th: ({ children }) => (
            <th
              className="
                border-b
                border-[#DDD8CF]
                px-3
                py-2.5
                font-bold
                text-[#13264B]
              "
            >
              {children}
            </th>
          ),

          // ----------------------------------------------------
          // TABLE BODY
          // ----------------------------------------------------

          tbody: ({ children }) => (
            <tbody>
              {children}
            </tbody>
          ),

          // ----------------------------------------------------
          // TABLE ROW
          // ----------------------------------------------------

          tr: ({ children }) => (
            <tr
              className="
                border-b
                border-[#E9E5DE]
                last:border-b-0
              "
            >
              {children}
            </tr>
          ),

          // ----------------------------------------------------
          // TABLE CELL
          // ----------------------------------------------------

          td: ({ children }) => (
            <td
              className="
                px-3
                py-2.5
                align-top
                text-[#35465A]
              "
            >
              {children}
            </td>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}


// ============================================================
// COMPONENT
// ============================================================

export default function MedicalChatbot({
  selectedLocation = null,
  className = "",
}) {
  const [messages, setMessages] = useState([
    INITIAL_MESSAGE,
  ]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  const inputRef = useRef(null);


  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);


  // ==========================================================
  // FOCUS INPUT
  // ==========================================================

  useEffect(() => {
    inputRef.current?.focus();
  }, []);


  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  const sendMessage = async (messageOverride = null) => {
    const text =
      typeof messageOverride === "string"
        ? messageOverride.trim()
        : input.trim();

    if (!text || loading) {
      return;
    }


    setError("");


    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: text,
    };


    const conversationBeforeRequest = [
      ...messages,
      userMessage,
    ];


    setMessages(conversationBeforeRequest);

    setInput("");

    setLoading(true);


    try {
      const response =
        await api.medicalChat({
          message: text,

          conversation: conversationBeforeRequest
            .filter(
              (message) =>
                message.role === "user" ||
                message.role === "assistant"
            )
            .slice(-12)
            .map((message) => ({
              role: message.role,
              content: message.content,
            })),

          location: selectedLocation
            ? {
                stateId:
                  selectedLocation.stateId ?? null,

                stateName:
                  selectedLocation.stateName ?? null,

                districtId:
                  selectedLocation.districtId ?? null,

                districtName:
                  selectedLocation.districtName ?? null,

                talukId:
                  selectedLocation.talukId ?? null,

                talukName:
                  selectedLocation.talukName ?? null,
              }
            : null,
        });


      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content:
          response?.answer ||
          "I was unable to generate a response.",
      };


      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

    } catch (err) {
      setError(
        err?.message ||
          "Unable to contact the medical assistant."
      );

    } finally {
      setLoading(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };


  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      sendMessage();
    }
  };


  // ==========================================================
  // CLEAR CHAT
  // ==========================================================

  const clearChat = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: `initial-${Date.now()}`,
      },
    ]);

    setInput("");

    setError("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className={`
        flex
        h-full
        min-h-[600px]
        w-full
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-[#E7E2D8]
        bg-white
        shadow-sm
        ${className}
      `}
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-[#E7E2D8]
          bg-[#FCFAF6]
          px-5
          py-4
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-[#EAF6EE]
              text-[#0B7A33]
            "
          >
            <Bot size={21} />
          </div>


          <div>

            <h2
              className="
                text-[15px]
                font-bold
                text-[#13264B]
              "
            >
              AI Medical Assistant
            </h2>

            <p
              className="
                mt-0.5
                text-[11px]
                text-[#7A8798]
              "
            >
              General medical information
            </p>

          </div>

        </div>


        <button
          type="button"
          onClick={clearChat}
          disabled={loading}
          title="Clear conversation"
          className="
            rounded-lg
            p-2
            text-[#7A8798]
            transition
            hover:bg-[#F3F0E9]
            hover:text-[#13264B]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <Trash2 size={17} />
        </button>

      </div>


      {/* ======================================================
          SAFETY NOTICE
      ====================================================== */}

      <div
        className="
          flex
          gap-2
          border-b
          border-[#E7E2D8]
          bg-[#FFF9E8]
          px-4
          py-3
          text-[11px]
          leading-5
          text-[#725B16]
        "
      >

        <AlertTriangle
          size={16}
          className="mt-0.5 shrink-0"
        />

        <p>
          This assistant provides general health
          information. It does not diagnose medical
          conditions or prescribe medicines.
        </p>

      </div>


      {/* ======================================================
          LOCATION CONTEXT
      ====================================================== */}

      {selectedLocation?.talukName && (

        <div
          className="
            border-b
            border-[#E7E2D8]
            bg-[#F8FBFD]
            px-4
            py-2.5
            text-[11px]
            text-[#526173]
          "
        >

          <span className="font-semibold">
            Current location:
          </span>{" "}

          {selectedLocation.talukName}

          {selectedLocation.districtName
            ? `, ${selectedLocation.districtName}`
            : ""}

          {selectedLocation.stateName
            ? `, ${selectedLocation.stateName}`
            : ""}

        </div>

      )}


      {/* ======================================================
          MESSAGES
      ====================================================== */}

      <div
        className="
          flex-1
          space-y-4
          overflow-y-auto
          bg-[#FCFAF6]
          p-4
          sm:p-5
        "
      >

        {messages.map((message) => {

          const isUser =
            message.role === "user";


          return (
            <div
              key={message.id}
              className={`
                flex
                gap-2.5
                ${
                  isUser
                    ? "justify-end"
                    : "justify-start"
                }
              `}
            >

              {!isUser && (

                <div
                  className="
                    mt-1
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-[#EAF6EE]
                    text-[#0B7A33]
                  "
                >
                  <Bot size={16} />
                </div>

              )}


              <div
                className={`
                  max-w-[82%]
                  rounded-2xl
                  px-4
                  py-3
                  ${
                    isUser
                      ? `
                        rounded-br-md
                        bg-[#13264B]
                        text-white
                      `
                      : `
                        rounded-bl-md
                        border
                        border-[#E7E2D8]
                        bg-white
                        text-[#35465A]
                      `
                  }
                `}
              >

                {isUser ? (
                  <div
                    className="
                      whitespace-pre-wrap
                      break-words
                      text-[13px]
                      leading-6
                    "
                  >
                    {message.content}
                  </div>
                ) : (
                  <MedicalMarkdown
                    content={message.content}
                  />
                )}

              </div>


              {isUser && (

                <div
                  className="
                    mt-1
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-[#E8EEF5]
                    text-[#13264B]
                  "
                >
                  <User size={16} />
                </div>

              )}

            </div>
          );
        })}


        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (

          <div
            className="
              flex
              items-start
              gap-2.5
            "
          >

            <div
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-[#EAF6EE]
                text-[#0B7A33]
              "
            >
              <Bot size={16} />
            </div>


            <div
              className="
                flex
                items-center
                gap-2
                rounded-2xl
                rounded-bl-md
                border
                border-[#E7E2D8]
                bg-white
                px-4
                py-3
              "
            >

              <Loader2
                size={15}
                className="animate-spin"
              />

              <span
                className="
                  text-[12px]
                  text-[#7A8798]
                "
              >
                Thinking...
              </span>

            </div>

          </div>

        )}


        <div ref={messagesEndRef} />

      </div>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div
          className="
            border-t
            border-[#F1D0D0]
            bg-[#FFF5F5]
            px-4
            py-2.5
            text-[11px]
            text-[#B42318]
          "
        >
          {error}
        </div>

      )}


      {/* ======================================================
          SUGGESTED QUESTIONS
      ====================================================== */}

      {messages.length === 1 && !loading && (

        <div
          className="
            border-t
            border-[#E7E2D8]
            bg-white
            px-4
            py-3
          "
        >

          <p
            className="
              mb-2
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.12em]
              text-[#9A9489]
            "
          >
            Try asking
          </p>


          <div
            className="
              flex
              flex-wrap
              gap-2
            "
          >

            {SUGGESTED_QUESTIONS.map(
              (question) => (

                <button
                  key={question}
                  type="button"
                  onClick={() =>
                    sendMessage(question)
                  }
                  className="
                    rounded-full
                    border
                    border-[#DCE5DD]
                    bg-[#F7FBF8]
                    px-3
                    py-1.5
                    text-left
                    text-[11px]
                    text-[#315C40]
                    transition
                    hover:border-[#AFC9B7]
                    hover:bg-[#EEF7F0]
                  "
                >
                  {question}
                </button>

              )
            )}

          </div>

        </div>

      )}


      {/* ======================================================
          INPUT
      ====================================================== */}

      <div
        className="
          border-t
          border-[#E7E2D8]
          bg-white
          p-3
        "
      >

        <div
          className="
            flex
            items-end
            gap-2
            rounded-xl
            border
            border-[#DCD7CE]
            bg-[#FCFAF6]
            px-3
            py-2
            transition
            focus-within:border-[#A9B8C8]
            focus-within:ring-2
            focus-within:ring-[#E8EEF5]
          "
        >

          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask a medical question..."
            rows={1}
            maxLength={2000}
            disabled={loading}
            className="
              max-h-28
              min-h-[38px]
              flex-1
              resize-none
              bg-transparent
              py-2
              text-[13px]
              text-[#1F3144]
              outline-none
              placeholder:text-[#9A9489]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          />


          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={
              loading ||
              !input.trim()
            }
            title="Send message"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-[#13264B]
              text-white
              transition
              hover:bg-[#1B3A62]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >

            {loading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Send size={16} />
            )}

          </button>

        </div>


        <p
          className="
            mt-2
            px-1
            text-[9px]
            text-[#9A9489]
          "
        >
          Press Enter to send · Shift + Enter for a new line
        </p>

      </div>

    </div>
  );
}