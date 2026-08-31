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
  Trash2,
  MessageSquareText,
  HeartPulse,
  Stethoscope,
  Paperclip,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { api } from "../../api";

import { useAuth } from "../../context/AuthContext";

import heroRight
  from "../../assets/ui/medical-hero-right.png";

import robot
  from "../../assets/ui/medical-robot.png";

import doctor
  from "../../assets/ui/medical-doctor.png";

import botAvatar
  from "../../assets/ui/medical-bot.png";


const QUICK_QUESTIONS = [
  "How to prevent dengue?",
  "What causes headache?",
  "Tips for a healthy lifestyle",
  "Is fever always a sign of infection?",
];


function MedicalMarkdown({
  content,
}) {

  return (

    <div
      className="
        break-words
        text-[13px]
        leading-[1.75]
        text-[#111820]
      "
    >

      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
        ]}
        components={{

          p: ({
            children,
          }) => (
            <p className="mb-2.5 last:mb-0">
              {children}
            </p>
          ),

          ul: ({
            children,
          }) => (
            <ul
              className="
                mb-2.5
                ml-5
                list-disc
                space-y-1
              "
            >
              {children}
            </ul>
          ),

          ol: ({
            children,
          }) => (
            <ol
              className="
                mb-2.5
                ml-5
                list-decimal
                space-y-1
              "
            >
              {children}
            </ol>
          ),

          li: ({
            children,
          }) => (
            <li className="pl-1">
              {children}
            </li>
          ),

          strong: ({
            children,
          }) => (
            <strong
              className="
                font-bold
                text-[#102A43]
              "
            >
              {children}
            </strong>
          ),

          h1: ({
            children,
          }) => (
            <h1
              className="
                mb-2
                mt-1
                text-[18px]
                font-bold
                text-[#102A43]
              "
            >
              {children}
            </h1>
          ),

          h2: ({
            children,
          }) => (
            <h2
              className="
                mb-2
                mt-3
                text-[16px]
                font-bold
                text-[#102A43]
              "
            >
              {children}
            </h2>
          ),

          h3: ({
            children,
          }) => (
            <h3
              className="
                mb-2
                mt-3
                text-[14px]
                font-bold
                text-[#087A32]
              "
            >
              {children}
            </h3>
          ),

        }}
      >
        {content || ""}
      </ReactMarkdown>

    </div>

  );
}


export default function MedicalChatbot({
  selectedLocation,
}) {

  const { session } = useAuth();

  const username =
    session?.username ||
    session?.user?.username ||
    session?.user?.name ||
    session?.name ||
    "User";

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


  const messagesEndRef =
    useRef(null);


  const locationName =
    selectedLocation?.talukName ||
    selectedLocation?.districtName ||
    selectedLocation?.stateName ||
    "Selected location";


  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [
    messages,
    loading,
  ]);


  /*
   * CLEAR CHAT
   */
  const clearChat = () => {

    if (loading) {
      return;
    }

    setMessages([]);
    setInput("");

  };


  /*
   * SEND MESSAGE
   */
  const sendMessage = async (
    value = input
  ) => {

    const message =
      String(value || "").trim();


    if (
      !message ||
      loading
    ) {
      return;
    }


    const userMessage = {

      role: "user",

      content: message,

      time:
        new Date().toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),

    };


    const updatedMessages =
      [
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
            selectedLocation ||
            null,

        });


      setMessages(
        (previous) => [

          ...previous,

          {

            role:
              "assistant",

            content:
              response?.response ||
              response?.message ||
              response?.answer ||
              "I couldn't generate a response right now.",

            time:
              new Date().toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              ),

          },

        ]
      );

    } catch (
      error
    ) {

      setMessages(
        (previous) => [

          ...previous,

          {

            role:
              "assistant",

            content:
              error?.message ||
              "I'm currently unable to connect to the medical assistant. Please try again shortly.",

            time:
              new Date().toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              ),

          },

        ]
      );

    } finally {

      setLoading(false);

    }

  };


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


  const hasMessages =
    messages.length > 0;


  return (

    <section
      className="
        relative
        min-h-[calc(100vh-56px)]
        w-full
        bg-white
        text-[#101A31]
      "
    >

      {/* =================================================
          HERO
      ================================================= */}

      <div
        className="
          relative
          mx-auto
          h-[218px]
          max-w-[1250px]
          overflow-hidden
          rounded-[16px]
          bg-[#F4FBF6]
        "
      >

        <img
          src={heroRight}
          alt=""
          className="
            absolute
            inset-y-0
            right-0
            h-full
            w-[62%]
            object-cover
            object-left
          "
        />


        {/* ROBOT */}

        <div
          className="
            absolute
            left-[18px]
            top-[12px]
            h-[190px]
            w-[148px]
            overflow-hidden
            rounded-[11px]
            bg-white/80
          "
        >

          <img
            src={robot}
            alt="Medical assistant robot"
            className="
              h-full
              w-full
              object-contain
              object-bottom
            "
          />

        </div>


        {/* HERO TEXT */}

        <div
          className="
            absolute
            left-[183px]
            top-[36px]
            z-10
          "
        >

          <h1
            className="
              text-[25px]
              font-semibold
              tracking-[-0.02em]
              text-[#101A31]
            "
          >
            Hello {username}! 👋
          </h1>


          <h2
            className="
              mt-[5px]
              text-[24px]
              font-semibold
              text-[#078445]
            "
          >
            I’m your Medical Assistant
          </h2>


          <p
            className="
              mt-[8px]
              text-[13px]
              leading-[1.65]
              text-[#13202A]
            "
          >
            Ask any medical related issues
            and get reliable
            <br />
            information and guidance.
          </p>

        </div>


        {/* =================================================
            HERO CLEAR CHAT BUTTON REMOVED
            =================================================

            The Trash2 button that was previously here
            has intentionally been removed.

            Clear Chat now exists ONLY in the chat header.
        */}


        {/* HERO TABS */}

        <div
          className="
            absolute
            bottom-[-1px]
            left-[42px]
            z-20
            flex
            gap-[12px]
          "
        >

          {[
            [
              "Precautions",
              ShieldCheck,
            ],

            [
              "Diseases",
              Stethoscope,
            ],

            [
              "General Health",
              HeartPulse,
            ],

          ].map(
            (
              [
                label,
                Icon,
              ],
              index
            ) => (

              <button
                key={label}
                type="button"
                onClick={() =>
                  sendMessage(
                    QUICK_QUESTIONS[
                      index
                    ]
                  )
                }
                className={`
                  flex
                  h-[37px]
                  items-center
                  gap-2
                  rounded-t-[18px]
                  border
                  border-b-0
                  border-[#DDE6E0]
                  bg-white
                  px-[18px]
                  text-[13px]
                  font-medium
                  ${
                    index === 0
                      ? "text-[#078445]"
                      : "text-[#174D9A]"
                  }
                `}
              >

                <Icon
                  size={17}
                  strokeWidth={1.7}
                />

                {label}

              </button>

            )
          )}

        </div>

      </div>


      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {!hasMessages && (

        <div
          className="
            mx-auto
            mt-[32px]
            grid
            max-w-[1250px]
            grid-cols-[minmax(0,1fr)_280px]
            gap-[28px]
          "
        >

          {/* MAIN CARD */}

          <section
            className="
              relative
              min-h-[554px]
              rounded-[17px]
              border
              border-[#E3E8E5]
              bg-white
              px-[40px]
              pt-[36px]
              shadow-[0_1px_4px_rgba(16,42,67,0.02)]
            "
          >

            <div
              className="
                mx-auto
                flex
                max-w-[730px]
                flex-col
                items-center
                text-center
              "
            >

              <div
                className="
                  flex
                  h-[63px]
                  w-[63px]
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  bg-[#EAF8EF]
                "
              >

                <img
                  src={botAvatar}
                  alt=""
                  className="
                    h-[53px]
                    w-[53px]
                    object-contain
                  "
                />

              </div>


              <h2
                className="
                  mt-[18px]
                  text-[24px]
                  font-medium
                  tracking-[-0.02em]
                  text-[#101A31]
                "
              >
                Ask any medical related issues
              </h2>


              <p
                className="
                  mt-[10px]
                  max-w-[620px]
                  text-[15px]
                  leading-[1.65]
                  text-[#4C5B6C]
                "
              >
                Get information about symptoms,
                precautions, diseases,
                <br />
                healthy habits and general wellness.
              </p>


              {/* QUICK QUESTIONS */}

              <div
                className="
                  mt-[32px]
                  grid
                  w-full
                  max-w-[640px]
                  grid-cols-2
                  gap-[14px]
                "
              >

                {QUICK_QUESTIONS.map(
                  (
                    question
                  ) => (

                    <button
                      key={question}
                      type="button"
                      onClick={() =>
                        sendMessage(
                          question
                        )
                      }
                      className="
                        flex
                        h-[61px]
                        items-center
                        gap-[14px]
                        rounded-[13px]
                        border
                        border-[#DCE8E0]
                        bg-white
                        px-[16px]
                        text-left
                        text-[14px]
                        text-[#405064]
                        transition
                        hover:border-[#A9D3B8]
                        hover:bg-[#FBFEFC]
                      "
                    >

                      <span
                        className="
                          flex
                          h-[32px]
                          w-[32px]
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-[#F0F9F2]
                          text-[#087A32]
                        "
                      >

                        <MessageSquareText
                          size={17}
                          strokeWidth={1.7}
                        />

                      </span>

                      {question}

                    </button>

                  )
                )}

              </div>

            </div>


            {/* INPUT */}

            <div
              className="
                absolute
                bottom-[70px]
                left-[40px]
                right-[40px]
                flex
                h-[70px]
                items-center
                rounded-[16px]
                border
                border-[#47B378]
                bg-white
                px-[15px]
                shadow-[0_2px_11px_rgba(39,135,83,0.12)]
                focus-within:border-[#1E9653]
              "
            >

              <span
                className="
                  mr-[13px]
                  text-[#17A45A]
                "
              >

                <Bot
                  size={24}
                  strokeWidth={1.8}
                />

              </span>


              <textarea
                value={input}
                onChange={(e) =>
                  setInput(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                rows={1}
                placeholder="Type your medical question here..."
                aria-label="Medical question"
                className="
                  min-h-[25px]
                  flex-1
                  resize-none
                  overflow-hidden
                  bg-transparent
                  px-1
                  py-1
                  text-[14px]
                  leading-[25px]
                  text-[#151719]
                  outline-none
                  placeholder:text-[#8B96A4]
                "
              />


              <button
                type="button"
                onClick={() =>
                  sendMessage()
                }
                disabled={
                  loading ||
                  !input.trim()
                }
                aria-label="Send medical question"
                className="
                  flex
                  h-[43px]
                  w-[43px]
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#168F48]
                  text-white
                  shadow-sm
                  disabled:opacity-40
                "
              >

                <Send
                  size={21}
                />

              </button>

            </div>


            <p
              className="
                absolute
                bottom-[31px]
                left-0
                right-0
                text-center
                text-[11px]
                text-[#8A94A0]
              "
            >
              Please note: I provide general information only
              and not a diagnosis or medical advice.
            </p>

          </section>


          {/* DOCTOR */}

          <aside
            className="
              flex
              flex-col
              items-center
              pt-[5px]
            "
          >

            <img
              src={doctor}
              alt="Medical guidance"
              className="
                h-[300px]
                w-[280px]
                object-contain
                object-bottom
              "
            />


            <div
              className="
                mt-[25px]
                w-full
                rounded-[15px]
                bg-[#F3FAF4]
                px-[25px]
                py-[22px]
                text-center
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-[14px]
                  font-semibold
                  text-[#078445]
                "
              >

                <ShieldCheck
                  size={20}
                  fill="#1A9A50"
                  className="text-white"
                />

                Your health, our priority

              </div>


              <p
                className="
                  mt-[14px]
                  text-[12px]
                  leading-[1.75]
                  text-[#405064]
                "
              >
                I'm here to help you with reliable
                <br />
                information and guidance for a
                <br />
                healthier you and your family.
              </p>

            </div>

          </aside>

        </div>

      )}


      {/* =================================================
          CHAT STATE
      ================================================= */}

      {hasMessages && (

        <div
          className="
            mx-auto
            mt-[30px]
            grid
            max-w-[1250px]
            grid-cols-[minmax(0,1fr)_280px]
            gap-[28px]
          "
        >

          <section
            className="
              relative
              min-h-[600px]
              overflow-hidden
              rounded-[17px]
              border
              border-[#E3E8E5]
              bg-white
              px-[24px]
              pb-[112px]
              pt-[24px]
            "
          >

            {/* CHAT HEADER */}

            <div
              className="
                mb-[18px]
                flex
                items-center
                justify-between
                border-b
                border-[#E9EDE9]
                pb-[12px]
              "
            >

              <p
                className="
                  text-[12px]
                  text-[#7A8598]
                "
              >
                Medical Assistant • {locationName}
              </p>


              {/* CLEAR CHAT REMAINS HERE */}

              <button
                type="button"
                onClick={
                  clearChat
                }
                disabled={loading}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-lg
                  px-2
                  py-1.5
                  text-[12px]
                  text-[#6A7480]
                  transition
                  hover:bg-[#F5F8F6]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >

                <Trash2
                  size={15}
                />

                Clear chat

              </button>

            </div>


            {/* MESSAGES */}

            <div
              className="
                max-h-[455px]
                overflow-y-auto
                pr-[8px]
              "
            >

              <div
                className="
                  space-y-[18px]
                "
              >

                {messages.map(
                  (
                    message,
                    index
                  ) => {

                    const user =
                      message.role ===
                      "user";


                    return (

                      <div
                        key={`${message.role}-${index}`}
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
                              mr-[12px]
                              mt-[2px]
                              h-[43px]
                              w-[43px]
                              shrink-0
                              rounded-full
                              object-contain
                            "
                          />

                        )}


                        <div
                          className={`
                            max-w-[680px]
                            ${
                              user
                                ? "rounded-[15px] rounded-br-[4px] bg-[#EAF8EC] px-[17px] py-[11px]"
                                : "rounded-[15px] border border-[#E0E6E1] bg-white px-[17px] py-[12px]"
                            }
                          `}
                        >

                          {user ? (

                            <p
                              className="
                                text-[13px]
                                leading-6
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


                          <p
                            className="
                              mt-[4px]
                              text-right
                              text-[10px]
                              text-[#7C858C]
                            "
                          >
                            {message.time}
                          </p>

                        </div>

                      </div>

                    );

                  }
                )}


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
                        mr-[12px]
                        h-[43px]
                        w-[43px]
                        rounded-full
                      "
                    />


                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-[15px]
                        border
                        border-[#E0E6E1]
                        px-4
                        py-3
                        text-[12px]
                        text-[#6B7379]
                      "
                    >

                      <Loader2
                        size={15}
                        className="animate-spin"
                      />

                      Medical assistant is thinking...

                    </div>

                  </div>

                )}


                <div
                  ref={
                    messagesEndRef
                  }
                />

              </div>

            </div>


            {/* CHAT INPUT */}

            <div
              className="
                absolute
                bottom-[25px]
                left-[24px]
                right-[24px]
                flex
                h-[64px]
                items-center
                rounded-[15px]
                border
                border-[#47B378]
                bg-white
                px-[13px]
                shadow-[0_2px_11px_rgba(39,135,83,0.12)]
              "
            >

              <button
                type="button"
                className="
                  mr-[10px]
                  text-[#7B8792]
                "
                aria-label="Attach"
              >

                <Paperclip
                  size={19}
                />

              </button>


              <textarea
                value={input}
                onChange={(e) =>
                  setInput(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                rows={1}
                placeholder="Ask me anything about health, precautions, risks..."
                className="
                  min-h-[24px]
                  flex-1
                  resize-none
                  overflow-hidden
                  bg-transparent
                  px-1
                  py-1
                  text-[14px]
                  leading-[24px]
                  outline-none
                  placeholder:text-[#8B96A4]
                "
              />


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
                  h-[43px]
                  w-[43px]
                  items-center
                  justify-center
                  rounded-full
                  bg-[#168F48]
                  text-white
                  disabled:opacity-40
                "
              >

                <Send
                  size={20}
                />

              </button>

            </div>

          </section>


          {/* RIGHT DOCTOR */}

          <aside
            className="
              flex
              flex-col
              items-center
              pt-[5px]
            "
          >

            <img
              src={doctor}
              alt="Medical guidance"
              className="
                h-[300px]
                w-[280px]
                object-contain
                object-bottom
              "
            />


            <div
              className="
                mt-[25px]
                w-full
                rounded-[15px]
                bg-[#F3FAF4]
                px-[25px]
                py-[22px]
                text-center
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-[14px]
                  font-semibold
                  text-[#078445]
                "
              >

                <ShieldCheck
                  size={20}
                />

                Your health, our priority

              </div>


              <p
                className="
                  mt-[14px]
                  text-[12px]
                  leading-[1.75]
                  text-[#405064]
                "
              >
                I'm here to help you with reliable
                information and guidance for a healthier
                you and your family.
              </p>

            </div>

          </aside>

        </div>

      )}


      {/* FOOTER DISCLAIMER */}

      <p
        className="
          mx-auto
          mt-[24px]
          max-w-[1250px]
          text-center
          text-[12px]
          text-[#687487]
        "
      >

        <ShieldCheck
          size={15}
          className="
            mr-2
            inline-block
          "
        />

        Information provided here is for general
        awareness only.

        <br />

        For medical emergencies, please contact
        your healthcare provider.

      </p>

    </section>

  );
}