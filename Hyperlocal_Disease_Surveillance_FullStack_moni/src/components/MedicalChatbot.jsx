import { useEffect, useRef, useState } from "react";

import {
  Bot,
  Paperclip,
  Send,
  ShieldCheck,
  Trash2,
  Mic,
  HeartPulse,
  Stethoscope,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { api } from "../../api";

import heroRight from "../../assets/ui/medical-hero-right.png";
import robot from "../../assets/ui/medical-robot.png";
import doctor from "../../assets/ui/medical-doctor.png";
import botAvatar from "../../assets/ui/medical-bot.png";


// ============================================================
// MARKDOWN
// ============================================================

function MedicalMarkdown({ content }) {
  return (
    <div
      className="
        break-words
        text-[13px]
        leading-[1.85]
        text-[#111315]
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-[8px] last:mb-0">
              {children}
            </p>
          ),

          ul: ({ children }) => (
            <ul className="my-[3px] space-y-[1px]">
              {children}
            </ul>
          ),

          li: ({ children }) => (
            <div>{children}</div>
          ),

          strong: ({ children }) => (
            <strong className="font-bold">
              {children}
            </strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}


// ============================================================
// QUICK ACTION BUTTON
// ============================================================

function QuickAction({
  label,
  icon: Icon,
  onClick,
  green = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        h-[36px]
        items-center
        gap-[8px]
        rounded-full
        border
        border-[#DDE3E5]
        bg-white
        px-[15px]
        text-[12px]
        font-medium
        transition-all
        duration-200
        hover:bg-[#F7FBF8]
        ${
          green
            ? "text-[#14914A]"
            : "text-[#173E78]"
        }
      `}
    >
      <Icon
        size={17}
        strokeWidth={1.7}
      />

      {label}
    </button>
  );
}


// ============================================================
// SUGGESTION BUTTON
// ============================================================

function SuggestionButton({
  text,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex
        h-[62px]
        items-center
        gap-[14px]
        rounded-[13px]
        border
        border-[#DDEBE2]
        bg-white
        px-[18px]
        text-left
        text-[14px]
        text-[#4B5563]
        transition-all
        duration-200
        hover:border-[#B8DCC4]
        hover:bg-[#F8FCF9]
      "
    >
      <span
        className="
          flex
          h-[30px]
          w-[30px]
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-[#F0F8F2]
        "
      >
        <span
          className="
            text-[15px]
            text-[#248A52]
          "
        >
          ▣
        </span>
      </span>

      <span>
        {text}
      </span>
    </button>
  );
}


// ============================================================
// MEDICAL ASSISTANT
// ============================================================

export default function MedicalChatbot({
  selectedLocation,
}) {

  // ==========================================================
  // CHAT STATE
  // ==========================================================

  /*
   * IMPORTANT:
   *
   * Start with an empty conversation.
   * This makes the initial Medical Assistant screen match
   * the reference design.
   */

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

  const endRef =
    useRef(null);


  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {

    endRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [
    messages,
    loading,
  ]);


  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  const sendMessage = async (
    presetMessage = null
  ) => {

    const text = (
      presetMessage !== null
        ? presetMessage
        : input
    ).trim();


    if (
      !text ||
      loading
    ) {
      return;
    }


    const userMessage = {
      role: "user",
      content: text,
      time: "Now",
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
          message: text,
          conversation,
          location:
            selectedLocation || null,
        });


      setMessages(
        previous => [
          ...previous,
          {
            role: "assistant",
            content:
              response?.response ||
              response?.message ||
              response?.answer ||
              "I couldn't generate a response right now.",
            time: "Now",
          },
        ]
      );

    } catch (error) {

      setMessages(
        previous => [
          ...previous,
          {
            role: "assistant",
            content:
              "I'm currently unable to connect to the medical assistant. Please try again shortly.",
            time: "Now",
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

    if (loading) {
      return;
    }

    /*
     * IMPORTANT:
     * Actually clear the conversation.
     *
     * Do NOT restore INITIAL_MESSAGES.
     */

    setMessages([]);

    setInput("");
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
  // QUICK QUESTIONS
  // ==========================================================

  const quickQuestions = [
    "How to prevent dengue?",
    "What causes headache?",
    "Tips for a healthy lifestyle",
    "Is fever always a sign of infection?",
  ];


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      className="
        relative
        h-[862px]
        overflow-hidden
        rounded-[15px]
        border
        border-[#E2E5E6]
        bg-white
      "
    >

      {/* ======================================================
          HERO
      ====================================================== */}

      <div
        className="
          relative
          mx-[14px]
          mt-[14px]
          h-[205px]
          overflow-hidden
          rounded-[15px]
          bg-[#F8FCF8]
        "
      >

        {/* ====================================================
            HERO RIGHT IMAGE
        ==================================================== */}

        <img
          src={heroRight}
          alt=""
          className="
            absolute
            right-0
            top-0
            h-full
            w-[490px]
            object-cover
            object-left
          "
        />


        {/* ====================================================
            ROBOT
        ==================================================== */}

        <img
          src={robot}
          alt="Medical assistant robot"
          className="
            absolute
            bottom-[-2px]
            left-[18px]
            h-[194px]
            w-[190px]
            object-contain
            object-bottom
          "
        />


        {/* ====================================================
            HERO TEXT
        ==================================================== */}

        <div
          className="
            absolute
            left-[213px]
            top-[31px]
            z-20
          "
        >

          <h2
            className="
              text-[25px]
              font-semibold
              tracking-[-0.02em]
              text-[#101A31]
            "
          >
            Hello Monish! 👋
          </h2>


          <h3
            className="
              mt-[3px]
              text-[24px]
              font-semibold
              text-[#078445]
            "
          >
            I’m your Medical Assistant
          </h3>


          <p
            className="
              mt-[8px]
              text-[13px]
              leading-[1.65]
              text-[#13202A]
            "
          >
            I can help you with health information, precautions,
            <br />
            disease risks and general wellness guidance.
          </p>


          {/* ==================================================
              QUICK ACTIONS
          ================================================== */}

          <div
            className="
              mt-[18px]
              flex
              gap-[13px]
            "
          >

            <QuickAction
              label="Precautions"
              icon={ShieldCheck}
              green
              onClick={() =>
                sendMessage(
                  "What precautions should I take?"
                )
              }
            />


            <QuickAction
              label="Diseases"
              icon={Stethoscope}
              onClick={() =>
                sendMessage(
                  "Tell me about common diseases."
                )
              }
            />


            <QuickAction
              label="General Health"
              icon={HeartPulse}
              onClick={() =>
                sendMessage(
                  "Give me some general health advice."
                )
              }
            />

          </div>

        </div>


        {/* ====================================================
            CLEAR CHAT BUTTON
        ====================================================

        IMPORTANT:
        This is NOT hidden anymore.
        It is positioned in the top-right of the Medical
        Assistant hero.
        ==================================================== */}

        <button
          type="button"
          onClick={clearChat}
          disabled={
            loading ||
            messages.length === 0
          }
          aria-label="Clear chat"
          title="Clear chat"
          className="
            absolute
            right-[18px]
            top-[15px]
            z-50
            flex
            h-[38px]
            w-[38px]
            items-center
            justify-center
            rounded-full
            border
            border-[#DCE6DF]
            bg-white
            text-[#69756F]
            shadow-[0_3px_12px_rgba(30,80,50,.10)]
            transition-all
            duration-200
            hover:border-[#C8DDD0]
            hover:bg-[#F5FAF6]
            hover:text-[#D64545]
            disabled:cursor-not-allowed
            disabled:opacity-35
          "
        >

          <Trash2
            size={18}
            strokeWidth={1.8}
          />

        </button>

      </div>


      {/* ======================================================
          DATE SEPARATOR
      ====================================================== */}

      {messages.length > 0 && (

        <div
          className="
            mx-[18px]
            flex
            items-center
            gap-3
            py-[20px]
          "
        >

          <div
            className="
              h-px
              flex-1
              bg-[#E7E9E9]
            "
          />

          <span
            className="
              px-2
              text-[13px]
              text-[#8A8E95]
            "
          >
            Today
          </span>

          <div
            className="
              h-px
              flex-1
              bg-[#E7E9E9]
            "
          />

        </div>

      )}


      {/* ======================================================
          CHAT / EMPTY STATE AREA
      ====================================================== */}

      <div
        className={`
          relative
          ${
            messages.length === 0
              ? "h-[535px]"
              : "h-[488px]"
          }
          overflow-y-auto
          px-[22px]
          ${
            messages.length > 0
              ? "pr-[245px]"
              : "pr-[22px]"
          }
        `}
      >

        {/* ====================================================
            DOCTOR IMAGE
        ==================================================== */}

        <img
          src={doctor}
          alt="Medical professional"
          className="
            pointer-events-none
            absolute
            right-[8px]
            top-[77px]
            h-[223px]
            w-[235px]
            object-contain
          "
        />


        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

        {messages.length === 0 ? (

          <div
            className="
              flex
              h-full
              flex-col
              items-center
              pt-[34px]
            "
          >

            {/* BOT AVATAR */}

            <div
              className="
                flex
                h-[66px]
                w-[66px]
                items-center
                justify-center
              "
            >

              <img
                src={botAvatar}
                alt=""
                className="
                  h-[66px]
                  w-[66px]
                  object-contain
                "
              />

            </div>


            {/* TITLE */}

            <h2
              className="
                mt-[14px]
                text-center
                text-[24px]
                font-medium
                tracking-[-0.025em]
                text-[#101827]
              "
            >
              Ask any medical related issues
            </h2>


            {/* DESCRIPTION */}

            <p
              className="
                mt-[10px]
                text-center
                text-[15px]
                leading-[1.7]
                text-[#526174]
              "
            >
              Get information about symptoms, precautions, diseases,
              <br />
              healthy habits and general wellness.
            </p>


            {/* ==================================================
                SUGGESTION GRID
            ================================================== */}

            <div
              className="
                mt-[34px]
                grid
                w-[650px]
                max-w-full
                grid-cols-2
                gap-[16px]
              "
            >

              {quickQuestions.map(
                question => (
                  <SuggestionButton
                    key={question}
                    text={question}
                    onClick={() =>
                      sendMessage(
                        question
                      )
                    }
                  />
                )
              )}

            </div>

          </div>

        ) : (

          /* ===================================================
             CHAT MESSAGES
          =================================================== */

          <div
            className="
              space-y-[24px]
            "
          >

            {messages.map(
              (
                message,
                index
              ) => {

                const user =
                  message.role === "user";

                return (

                  <div
                    key={index}
                    className={`
                      flex
                      ${
                        user
                          ? "justify-end"
                          : "justify-start"
                      }
                    `}
                  >

                    {!user && (

                      <img
                        src={botAvatar}
                        alt=""
                        className="
                          mr-[14px]
                          mt-[4px]
                          h-[54px]
                          w-[54px]
                          shrink-0
                          rounded-full
                          object-cover
                        "
                      />

                    )}


                    <div
                      className={`
                        max-w-[520px]
                        ${
                          user
                            ? `
                              rounded-[15px]
                              rounded-br-[4px]
                              bg-[#EAF8EC]
                              px-[19px]
                              py-[12px]
                            `
                            : `
                              rounded-[15px]
                              border
                              border-[#E0E4E4]
                              bg-white
                              px-[18px]
                              py-[13px]
                              shadow-[0_1px_2px_rgba(0,0,0,0.02)]
                            `
                        }
                      `}
                    >

                      {user ? (

                        <p
                          className="
                            text-[13px]
                            text-[#10231A]
                          "
                        >
                          {message.content}
                        </p>

                      ) : (

                        <MedicalMarkdown
                          content={
                            message.content
                          }
                        />

                      )}


                      <div
                        className="
                          mt-[4px]
                          text-right
                          text-[10px]
                          text-[#7C858C]
                        "
                      >
                        {message.time}

                        {user &&
                          "  ✓✓"}
                      </div>

                    </div>

                  </div>

                );
              }
            )}


            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (

              <div
                className="
                  flex
                  items-start
                "
              >

                <img
                  src={botAvatar}
                  alt=""
                  className="
                    mr-[14px]
                    h-[54px]
                    w-[54px]
                    rounded-full
                  "
                />

                <div
                  className="
                    rounded-[15px]
                    border
                    border-[#E0E4E4]
                    bg-white
                    px-4
                    py-3
                    text-[12px]
                    text-[#6B7379]
                  "
                >
                  Medical assistant is thinking...
                </div>

              </div>

            )}


            <div
              ref={endRef}
            />

          </div>

        )}

      </div>


      {/* ======================================================
          INPUT BOX
      ====================================================== */}

      <div
        className="
          absolute
          bottom-[44px]
          left-[70px]
          right-[184px]
          flex
          h-[70px]
          items-center
          rounded-[17px]
          border
          border-[#4AB477]
          bg-white
          px-[14px]
          shadow-[0_2px_11px_rgba(39,135,83,0.14)]
        "
      >

        {/* ====================================================
            ATTACHMENT
        ==================================================== */}

        <button
          type="button"
          className="
            mr-[14px]
            flex
            h-[42px]
            w-[30px]
            shrink-0
            items-center
            justify-center
            text-[#65717B]
          "
          aria-label="Attach"
        >

          <Paperclip
            size={21}
            strokeWidth={1.7}
          />

        </button>


        {/* ====================================================
            TEXT INPUT

            IMPORTANT:
            Using INPUT instead of TEXTAREA here fixes the
            vertical clipping problem completely.
        ==================================================== */}

        <input
          type="text"
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Type your medical question here..."
          className="
            h-[42px]
            min-w-0
            flex-1
            border-0
            bg-transparent
            px-[5px]
            py-0
            text-[14px]
            leading-[42px]
            text-[#151719]
            outline-none
            placeholder:text-[#9BA3AC]
            placeholder:opacity-100
            disabled:opacity-50
          "
        />


        {/* ====================================================
            SEND
        ==================================================== */}

        <button
          type="button"
          onClick={() =>
            sendMessage()
          }
          disabled={
            loading ||
            !input.trim()
          }
          className="
            flex
            h-[48px]
            w-[48px]
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[#168D43]
            text-white
            transition-all
            duration-200
            hover:bg-[#11783A]
            disabled:cursor-not-allowed
            disabled:opacity-45
          "
          aria-label="Send"
        >

          <Send
            size={22}
            strokeWidth={1.8}
          />

        </button>

      </div>


      {/* ======================================================
          VOICE BUTTON
      ====================================================== */}

      <button
        type="button"
        className="
          absolute
          bottom-[43px]
          right-[28px]
          flex
          h-[70px]
          w-[66px]
          items-center
          justify-center
          rounded-[16px]
          border
          border-[#E1E5E7]
          bg-white
          text-[#102A43]
        "
        aria-label="Voice input"
      >

        <Mic
          size={23}
          strokeWidth={1.6}
        />

      </button>


      {/* ======================================================
          DISCLAIMER
      ====================================================== */}

      <p
        className="
          absolute
          bottom-[8px]
          left-0
          right-0
          text-center
          text-[12px]
          text-[#4C5157]
        "
      >
        Medical Assistant provides general information only and not a
        diagnosis or medical advice.
      </p>

    </section>
  );
}