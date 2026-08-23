import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bot,
  Send,
  Loader2,
  ShieldCheck,
  User,
  Trash2,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { api } from "../../api";


// ============================================================
// MARKDOWN NORMALIZER
// ============================================================

function normalizeMarkdown(content) {
  if (typeof content !== "string") {
    return "";
  }

  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/br>/gi, "\n")
    .trim();
}


// ============================================================
// MARKDOWN RENDERER (matches the green citizen-portal theme)
// ============================================================

function MedicalMarkdown({ content }) {
  const normalizedContent = normalizeMarkdown(content);

  return (
    <div className="medical-markdown break-words text-[13px] leading-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-1 text-[17px] font-bold leading-7 text-[#102A43]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2.5 mt-4 text-[15px] font-bold leading-6 text-[#102A43]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-[13.5px] font-bold leading-6 text-[#087A32]">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-bold text-[#102A43]">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-3 ml-5 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#087A32] underline underline-offset-2"
            >
              {children}
            </a>
          ),
          code: ({ inline, children }) =>
            inline ? (
              <code className="rounded bg-[#EEF2F0] px-1.5 py-0.5 font-mono text-[12px] text-[#102A43]">
                {children}
              </code>
            ) : (
              <code className="block overflow-x-auto rounded-lg bg-[#F4F5F7] p-3 font-mono text-[12px] leading-5 text-[#25364D]">
                {children}
              </code>
            ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-4 border-[#C9E3D0] bg-[#F7FBF8] px-3 py-2 text-[#526173]">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-[#E1E8E3]" />,
          table: ({ children }) => (
            <div className="my-3 w-full overflow-x-auto rounded-lg border border-[#E1E8E3]">
              <table className="w-full min-w-[480px] border-collapse text-left text-[12px] leading-5">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F5F7F4]">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-[#DDE5DD] px-3 py-2.5 font-bold text-[#102A43]">
              {children}
            </th>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-[#E9EDE9] last:border-b-0">
              {children}
            </tr>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2.5 align-top text-[#35465A]">
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


export default function MedicalChatbot({
  selectedLocation,
}) {

  // ==========================================================
  // STATE
  // ==========================================================

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm the AI Medical Information Assistant. You can ask me general questions about diseases, symptoms, prevention, hygiene, and public health.",
    },
  ]);

  const [input, setInput] = useState("");

  const [loading, setLoading] =
    useState(false);

  const messagesEndRef =
    useRef(null);


  // ==========================================================
  // LOCATION
  // ==========================================================

  const locationName =
    selectedLocation?.talukName ||
    selectedLocation?.districtName ||
    selectedLocation?.stateName ||
    "Selected location";


  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [
    messages,
    loading,
  ]);


  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  const sendMessage = async () => {

    const message =
      input.trim();


    if (
      !message ||
      loading
    ) {
      return;
    }


    const userMessage = {
      role: "user",
      content: message,
    };


    const updatedMessages = [
      ...messages,
      userMessage,
    ];


    setMessages(
      updatedMessages
    );

    setInput("");

    setLoading(true);


    try {

      const response =
        await api.medicalChat({
          message,

          conversation:
            updatedMessages,

          location:
            selectedLocation || null,
        });


      const assistantMessage = {
        role: "assistant",

        content:
          response?.response ||
          response?.message ||
          response?.answer ||
          "I couldn't generate a response right now.",
      };


      setMessages(
        (previous) => [
          ...previous,
          assistantMessage,
        ]
      );

    } catch (error) {

      setMessages(
        (previous) => [
          ...previous,
          {
            role: "assistant",
            content:
              error?.message ||
              "I'm currently unable to connect to the medical assistant. Please try again shortly.",
          },
        ]
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  };


  // ==========================================================
  // CLEAR CHAT
  // ==========================================================

  const clearChat = () => {

    if (loading) {
      return;
    }


    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm the AI Medical Information Assistant. You can ask me general questions about diseases, symptoms, prevention, hygiene, and public health.",
      },
    ]);

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        flex
        min-h-[650px]
        w-full
        flex-col
        bg-white
      "
    >

      {/* ======================================================
          CHAT HEADER
      ====================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-[#E5EDE7]
          bg-[#087A32]
          px-5
          py-4
          text-white
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              bg-white/15
            "
          >

            <Bot size={23} />

          </div>


          <div>

            <h3
              className="
                text-[16px]
                font-bold
              "
            >
              AI Medical Assistant
            </h3>

            <p
              className="
                mt-0.5
                text-[10px]
                text-white/80
              "
            >
              General medical information
            </p>

          </div>

        </div>


        {/* CLEAR CHAT */}

        <button
          type="button"
          onClick={clearChat}
          disabled={loading}
          className="
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-white/20
            bg-white/10
            px-3
            py-2
            text-[11px]
            font-medium
            transition
            hover:bg-white/20
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          <Trash2 size={14} />

          <span>
            Clear Chat
          </span>

        </button>

      </div>


      {/* ======================================================
          LOCATION CONTEXT
      ====================================================== */}

      <div
        className="
          border-b
          border-[#E8EDE9]
          bg-[#F7FAF8]
          px-5
          py-3
        "
      >

        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <ShieldCheck
            size={15}
            className="text-[#087A32]"
          />

          <p
            className="
              text-[11px]
              text-[#52606D]
            "
          >
            Current monitoring location:

            <span
              className="
                ml-1
                font-semibold
                text-[#102A43]
              "
            >
              {locationName}
            </span>

          </p>

        </div>

      </div>


      {/* ======================================================
          MESSAGES
      ====================================================== */}

      <div
        className="
          flex-1
          overflow-y-auto
          bg-[#FCFAF6]
          px-4
          py-5
          sm:px-6
        "
      >

        <div
          className="
            mx-auto
            w-full
            max-w-[900px]
            space-y-4
          "
        >

          {messages.map(
            (message, index) => {

              const isUser =
                message.role === "user";


              return (
                <div
                  key={index}
                  className={`
                    flex
                    gap-3
                    ${
                      isUser
                        ? "justify-end"
                        : "justify-start"
                    }
                  `}
                >

                  {/* ASSISTANT ICON */}

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
                        text-[#087A32]
                      "
                    >

                      <Bot size={16} />

                    </div>

                  )}


                  {/* MESSAGE */}

                  <div
                    className={`
                      max-w-[78%]
                      rounded-2xl
                      px-4
                      py-3
                      ${
                        isUser
                          ? `
                            text-[13px]
                            leading-6
                            rounded-br-md
                            bg-[#087A32]
                            text-white
                          `
                          : `
                            rounded-bl-md
                            border
                            border-[#E1E8E3]
                            bg-white
                            text-[#334155]
                            shadow-sm
                          `
                      }
                    `}
                  >

                    {isUser ? (
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    ) : (
                      <MedicalMarkdown content={message.content} />
                    )}

                  </div>


                  {/* USER ICON */}

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
                        bg-[#EEF5FF]
                        text-[#2563EB]
                      "
                    >

                      <User size={16} />

                    </div>

                  )}

                </div>
              );

            }
          )}


          {/* ==================================================
              LOADING
          ================================================== */}

          {loading && (

            <div
              className="
                flex
                items-start
                gap-3
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
                  text-[#087A32]
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
                  border-[#E1E8E3]
                  bg-white
                  px-4
                  py-3
                  text-[12px]
                  text-[#667085]
                  shadow-sm
                "
              >

                <Loader2
                  size={15}
                  className="
                    animate-spin
                    text-[#087A32]
                  "
                />

                Medical assistant is thinking...

              </div>

            </div>

          )}


          <div
            ref={messagesEndRef}
          />

        </div>

      </div>


      {/* ======================================================
          SAFETY NOTICE
      ====================================================== */}

      <div
        className="
          border-t
          border-[#E8EDE9]
          bg-[#FFFDF8]
          px-5
          py-2.5
        "
      >

        <div
          className="
            mx-auto
            max-w-[900px]
          "
        >

          <p
            className="
              text-[10px]
              leading-4
              text-[#7A8598]
            "
          >
            <span
              className="
                font-semibold
                text-[#52606D]
              "
            >
              Medical safety:
            </span>{" "}
            This assistant provides educational information
            only. It does not diagnose conditions, prescribe
            medicines, provide dosage instructions, or replace
            professional medical care. For emergencies or
            severe symptoms, seek immediate professional care.

          </p>

        </div>

      </div>


      {/* ======================================================
          INPUT
      ====================================================== */}

      <div
        className="
          border-t
          border-[#E8EDE9]
          bg-white
          px-4
          py-4
          sm:px-6
        "
      >

        <div
          className="
            mx-auto
            flex
            max-w-[900px]
            items-end
            gap-3
          "
        >

          <textarea
            value={input}
            onChange={(event) =>
              setInput(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            disabled={loading}
            rows={2}
            maxLength={5000}
            placeholder="Ask a medical question..."
            className="
              min-h-[50px]
              flex-1
              resize-none
              rounded-xl
              border
              border-[#D9E2DC]
              bg-[#FCFAF6]
              px-4
              py-3
              text-[13px]
              text-[#102A43]
              outline-none
              placeholder:text-[#9AA3AF]
              focus:border-[#087A32]
              focus:ring-2
              focus:ring-[#087A32]/10
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          />


          <button
            type="button"
            onClick={sendMessage}
            disabled={
              loading ||
              !input.trim()
            }
            className="
              flex
              h-[50px]
              w-[50px]
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[#087A32]
              text-white
              transition
              hover:bg-[#066B2B]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Send medical question"
          >

            {loading ? (

              <Loader2
                size={19}
                className="animate-spin"
              />

            ) : (

              <Send size={19} />

            )}

          </button>

        </div>

        <p
          className="
            mx-auto
            mt-2
            max-w-[900px]
            text-right
            text-[9px]
            text-[#9AA3AF]
          "
        >
          Press Enter to send • Shift + Enter for a new line
        </p>

      </div>

    </div>
  );
}