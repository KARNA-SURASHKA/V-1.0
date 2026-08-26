import {
  useRef,
  useState,
} from "react";

import {
  Bot,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";

import {
  api,
} from "../../../api";


// ============================================================
// FORMAT AI RESPONSE
// ============================================================

function FormattedResponse({
  text,
}) {

  if (!text) {
    return null;
  }


  const lines =
    String(text)
      .replace(
        /\r\n/g,
        "\n"
      )
      .split("\n");


  return (

    <div
      className="
        space-y-[3px]
      "
    >

      {lines.map(
        (
          rawLine,
          index
        ) => {

          const line =
            rawLine.trim();


          /*
           * EMPTY LINE
           */

          if (!line) {

            return (
              <div
                key={index}
                className="
                  h-[2px]
                "
              />
            );

          }


          /*
           * HORIZONTAL SEPARATOR
           */

          if (
            /^[-*_]{3,}$/.test(
              line
            )
          ) {

            return (
              <div
                key={index}
                className="
                  my-1
                  border-t
                  border-[#DDE7DF]
                "
              />
            );

          }


          /*
           * REMOVE HEADING SYMBOLS
           */

          const heading =
            line.replace(
              /^#{1,6}\s*/,
              ""
            );


          /*
           * BULLET
           */

          const bullet =
            heading.match(
              /^[-*•]\s+(.*)$/
            );


          if (bullet) {

            return (
              <div
                key={index}
                className="
                  flex
                  items-start
                  gap-1.5
                "
              >

                <span
                  className="
                    mt-[5px]
                    h-[4px]
                    w-[4px]
                    shrink-0
                    rounded-full
                    bg-[#3A9150]
                  "
                />

                <span>
                  {
                    formatInline(
                      bullet[1]
                    )
                  }
                </span>

              </div>
            );

          }


          /*
           * NUMBERED ITEM
           */

          const numbered =
            heading.match(
              /^(\d+)[.)]\s+(.*)$/
            );


          if (numbered) {

            return (
              <div
                key={index}
                className="
                  flex
                  items-start
                  gap-1.5
                "
              >

                <span
                  className="
                    shrink-0
                    font-semibold
                    text-[#347044]
                  "
                >
                  {numbered[1]}.
                </span>

                <span>
                  {
                    formatInline(
                      numbered[2]
                    )
                  }
                </span>

              </div>
            );

          }


          /*
           * NORMAL PARAGRAPH
           */

          return (
            <p
              key={index}
            >
              {
                formatInline(
                  heading
                )
              }
            </p>
          );

        }
      )}

    </div>

  );

}


// ============================================================
// INLINE MARKDOWN
// ============================================================

function formatInline(
  value
) {

  const text =
    String(
      value || ""
    );


  const parts =
    text.split(
      /(\*\*[^*]+\*\*|\*[^*]+\*)/
    );


  return parts.map(
    (
      part,
      index
    ) => {

      /*
       * BOLD
       */

      if (
        part.startsWith(
          "**"
        ) &&
        part.endsWith(
          "**"
        )
      ) {

        return (
          <strong
            key={index}
            className="
              font-semibold
              text-[#252B28]
            "
          >
            {
              part.slice(
                2,
                -2
              )
            }
          </strong>
        );

      }


      /*
       * ITALIC
       */

      if (
        part.startsWith(
          "*"
        ) &&
        part.endsWith(
          "*"
        )
      ) {

        return (
          <em
            key={index}
          >
            {
              part.slice(
                1,
                -1
              )
            }
          </em>
        );

      }


      return (
        <span
          key={index}
        >
          {part}
        </span>
      );

    }
  );

}


// ============================================================
// DASHBOARD CHATBOT
// ============================================================

export default function DashboardChatbot({
  selectedLocation,
  username,
  disease,
}) {

  const [
    messages,
    setMessages,
  ] = useState([]);


  const [
    input,
    setInput,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const inputRef =
    useRef(null);


  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  const send = async (
    preset = null
  ) => {

    const text =
      String(
        preset ??
          input
      ).trim();


    if (
      !text ||
      loading
    ) {
      return;
    }


    const userMessage = {
      role:
        "user",

      content:
        text,
    };


    const conversation = [
      ...messages,
      userMessage,
    ];


    setMessages(
      conversation
    );

    setInput("");
    setLoading(true);


    try {

      const response =
        await api.medicalChat({

          message:
            text,

          conversation:
            conversation,

          location:
            selectedLocation ||
            null,

        });


      const assistantText =
        response?.response ||
        response?.message ||
        response?.answer ||
        "I couldn't generate a response right now.";


      setMessages(
        (
          current
        ) => [

          ...current,

          {
            role:
              "assistant",

            content:
              assistantText,
          },

        ]
      );

    } catch (
      error
    ) {

      setMessages(
        (
          current
        ) => [

          ...current,

          {
            role:
              "assistant",

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
  // CLEAR CHAT
  // ==========================================================

  const clearChat = () => {

    if (
      loading
    ) {
      return;
    }


    setMessages([]);
    setInput("");

  };


  // ==========================================================
  // QUICK QUESTIONS
  // ==========================================================

  const suggestions = [

    "What precautions should I take?",

    `Tell me about ${
      disease ||
      "the disease"
    }`,

    "How is the disease situation in my area?",

  ];


  // ==========================================================
  // LATEST ASSISTANT MESSAGE
  // ==========================================================

  const latestAssistant =
    [...messages]
      .reverse()
      .find(
        (
          message
        ) =>
          message.role ===
          "assistant"
      );


  // ==========================================================
  // CHATBOT
  // ==========================================================

  return (

    <div
      className="
        flex
        h-full
        min-h-0
        min-w-0
        flex-col
        overflow-hidden
        bg-white
      "
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          flex
          h-[45px]
          shrink-0
          items-center
          justify-between
          border-b
          border-[#EEE9E2]
          px-[14px]
        "
      >

        <div
          className="
            flex
            min-w-0
            items-center
            gap-2
          "
        >

          <div
            className="
              flex
              h-[27px]
              w-[27px]
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#EFF7F0]
              text-[#2E9649]
            "
          >

            <Bot
              size={15}
              strokeWidth={1.8}
            />

          </div>


          <h2
            className="
              truncate
              text-[12px]
              font-semibold
              uppercase
              tracking-[0.025em]
              text-[#17191C]
            "
          >
            AI HEALTH ASSISTANT
          </h2>

        </div>


        {/* CLEAR */}

        <button
          type="button"
          onClick={
            clearChat
          }
          disabled={
            loading ||
            messages.length === 0
          }
          title="Clear chat"
          aria-label="Clear chat"
          className="
            flex
            h-[27px]
            w-[27px]
            shrink-0
            items-center
            justify-center
            rounded-[6px]
            text-[#737A80]
            transition
            hover:bg-[#FFF1F1]
            hover:text-[#D32F2F]
            disabled:cursor-default
            disabled:opacity-30
          "
        >

          <Trash2
            size={15}
            strokeWidth={1.8}
          />

        </button>

      </div>


      {/* =====================================================
          BODY
      ===================================================== */}

      <div
        className="
          flex
          h-0
          min-h-0
          flex-1
          flex-col
          overflow-hidden
          px-[14px]
          pb-[8px]
          pt-[9px]
        "
      >

        {/* ===================================================
            GREETING
        =================================================== */}

        {messages.length === 0 && (

          <div
            className="
              h-[59px]
              shrink-0
              overflow-hidden
              rounded-[9px]
              border
              border-[#DAD7D0]
              bg-[#FAFAF8]
              px-[11px]
              py-[8px]
              text-[10px]
              leading-[1.45]
              text-[#24282C]
            "
          >

            Hello{" "}
            {username ||
              "there"}! 👋

            <br />

            I&apos;m your AI Health
            Assistant.

            <br />

            How can I help you
            today?

          </div>

        )}


        {/* ===================================================
            QUICK QUESTIONS
        =================================================== */}

        <div
          className={`
            shrink-0
            ${
              messages.length === 0
                ? "mt-[7px]"
                : "mt-0"
            }
          `}
        >

          <div
            className="
              flex
              flex-col
              gap-[5px]
            "
          >

            {suggestions.map(
              (
                suggestion
              ) => (

                <button
                  key={
                    suggestion
                  }
                  type="button"
                  onClick={() =>
                    send(
                      suggestion
                    )
                  }
                  disabled={
                    loading
                  }
                  className="
                    flex
                    h-[34px]
                    w-full
                    shrink-0
                    items-center
                    overflow-hidden
                    rounded-[7px]
                    border
                    border-[#8CBF9A]
                    bg-white
                    px-[11px]
                    text-left
                    text-[10px]
                    font-medium
                    leading-none
                    text-[#347044]
                    transition
                    hover:bg-[#F3FAF4]
                    disabled:cursor-default
                    disabled:opacity-50
                  "
                >

                  <span className="
                    truncate
                  ">
                    {suggestion}
                  </span>

                </button>

              )
            )}

          </div>

        </div>


        {/* ===================================================
            RESPONSE AREA
        =================================================== */}

        {latestAssistant && (

          <div
            className="
              mt-[7px]
              h-0
              min-h-0
              flex-1
              overflow-hidden
              rounded-[8px]
              border
              border-[#E2E8E3]
              bg-[#F7FAF7]
            "
          >

            <div
              className="
                h-full
                min-h-0
                overflow-x-hidden
                overflow-y-auto
                overscroll-contain
                px-[10px]
                py-[8px]
                text-[9px]
                leading-[1.5]
                text-[#3F4843]

                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-[#C5D5C8]
                [&::-webkit-scrollbar-thumb]:hover:bg-[#AABFAF]
              "
            >

              <FormattedResponse
                text={
                  latestAssistant.content
                }
              />

            </div>

          </div>

        )}


        {/* ===================================================
            SPACER

            When there is no response, push input to the
            bottom of the available chatbot card.
        =================================================== */}

        {!latestAssistant && (

          <div
            className="
              min-h-[5px]
              flex-1
            "
          />

        )}


        {/* ===================================================
            INPUT
        =================================================== */}

        <form
          onSubmit={(
            event
          ) => {

            event.preventDefault();

            send();

          }}
          className="
            mt-[7px]
            flex
            h-[40px]
            shrink-0
            items-center
            gap-[6px]
            rounded-[9px]
            border
            border-[#DCD8D0]
            bg-white
            p-[5px]
            shadow-[0_1px_2px_rgba(0,0,0,.03)]
          "
        >

          <input
            ref={
              inputRef
            }
            value={
              input
            }
            onChange={(
              event
            ) =>
              setInput(
                event.target.value
              )
            }
            placeholder="
              Type your message...
            "
            className="
              min-w-0
              flex-1
              bg-transparent
              px-[6px]
              text-[10px]
              text-[#20252A]
              outline-none
              placeholder:text-[#8C9296]
            "
            aria-label="
              Chat message
            "
          />


          <button
            type="submit"
            disabled={
              !input.trim() ||
              loading
            }
            className="
              flex
              h-[29px]
              w-[29px]
              shrink-0
              items-center
              justify-center
              rounded-[7px]
              bg-[#3A9150]
              text-white
              transition
              hover:bg-[#2E7F43]
              disabled:cursor-default
              disabled:opacity-40
            "
            aria-label="
              Send message
            "
          >

            {loading ? (

              <Loader2
                size={14}
                className="
                  animate-spin
                "
              />

            ) : (

              <Send
                size={14}
                strokeWidth={2}
              />

            )}

          </button>

        </form>


        {/* ===================================================
            DISCLAIMER
        =================================================== */}

        <p
          className="
            mt-[4px]
            h-[10px]
            shrink-0
            text-center
            text-[8px]
            leading-[10px]
            text-[#8B9094]
          "
        >
          AI responses are for
          informational purposes only.
        </p>

      </div>

    </div>

  );

}