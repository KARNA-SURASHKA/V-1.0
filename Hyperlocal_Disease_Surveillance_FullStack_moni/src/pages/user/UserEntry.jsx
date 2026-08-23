import {
  useState,
} from "react";

import {
  ArrowLeft,
  Users,
} from "lucide-react";

import LocationSelector from "../../components/LocationSelector";

export default function UserEntry({
  onEnter,
  onBack,
}) {
  const [username, setUsername] =
    useState("");

  const [location, setLocation] =
    useState(null);

  const [error, setError] =
    useState("");


  const handleSubmit = (event) => {
    event.preventDefault();

    if (!username.trim()) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (!location?.talukId) {
      setError(
        "Please select your State, District, and Taluk."
      );
      return;
    }

    setError("");

    onEnter({
      username:
        username.trim(),

      defaultLocation:
        location,
    });
  };


  return (
    <div className="min-h-screen bg-[#FCFAF6] flex items-center justify-center px-6 py-12">

      <div className="w-full max-w-[520px]">

        <button
          onClick={onBack}
          className="
            flex
            items-center
            gap-1.5
            text-[14px]
            text-[#445064]
            hover:text-[#0B6D2E]
            mb-6
            transition-colors
          "
        >
          <ArrowLeft size={16} />
          Back to home
        </button>


        <div className="
          bg-white
          rounded-2xl
          border
          border-[#E8E2D8]
          shadow-sm
          p-8
        ">

          <div className="
            w-14
            h-14
            rounded-xl
            bg-[#0B7A33]
            flex
            items-center
            justify-center
            mb-5
          ">
            <Users
              size={28}
              className="text-white"
            />
          </div>


          <h2 className="
            text-[24px]
            font-semibold
            text-[#1F3144]
          ">
            User Portal
          </h2>


          <p className="
            text-[14px]
            text-[#445064]
            mt-1
            mb-6
          ">
            Enter your name and select your
            default location to view disease
            surveillance data.
          </p>


          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* NAME */}

            <div>

              <label
                className="
                  block
                  text-[13px]
                  font-medium
                  text-[#445064]
                  mb-1
                "
              >
                Your Name
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-[#E8E2D8]
                  px-4
                  py-2.5
                  text-[15px]
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#0B7A33]/30
                "
                placeholder="e.g. Ramesh Kumar"
              />

            </div>


            {/* LOCATION */}

            <div>

              <label className="
                block
                text-[13px]
                font-medium
                text-[#445064]
                mb-2
              ">
                Your Default Location
              </label>

              <LocationSelector
                onChange={setLocation}
              />

            </div>


            {/* ERROR */}

            {error && (
              <p className="
                text-[13px]
                text-[#C62828]
                bg-[#FBEAEA]
                rounded-lg
                px-3
                py-2
              ">
                {error}
              </p>
            )}


            {/* SUBMIT */}

            <button
              type="submit"
              className="
                w-full
                rounded-lg
                bg-gradient-to-r
                from-[#07892F]
                to-[#049437]
                hover:from-[#067C2B]
                hover:to-[#038A31]
                text-white
                font-semibold
                py-3
                transition-all
              "
            >
              View Disease Surveillance
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}