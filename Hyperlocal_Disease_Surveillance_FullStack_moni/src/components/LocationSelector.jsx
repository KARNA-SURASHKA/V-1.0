import {
  useEffect,
  useState,
} from "react";

import { api } from "../api";


export default function LocationSelector({
  value = null,
  onChange,
}) {

  const [
    states,
    setStates,
  ] = useState([]);


  const [
    districts,
    setDistricts,
  ] = useState([]);


  const [
    taluks,
    setTaluks,
  ] = useState([]);


  const [
    selectedState,
    setSelectedState,
  ] = useState(
    value?.stateId ?? ""
  );


  const [
    selectedDistrict,
    setSelectedDistrict,
  ] = useState(
    value?.districtId ?? ""
  );


  const [
    selectedTaluk,
    setSelectedTaluk,
  ] = useState(
    value?.talukId ?? ""
  );


  const [
    loadingStates,
    setLoadingStates,
  ] = useState(false);


  const [
    loadingDistricts,
    setLoadingDistricts,
  ] = useState(false);


  const [
    loadingTaluks,
    setLoadingTaluks,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // LOAD STATES
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadStates() {

      try {

        setLoadingStates(true);
        setError("");


        const data =
          await api.getStates();


        if (!cancelled) {

          setStates(
            Array.isArray(data)
              ? data
              : []
          );

        }

      } catch (err) {

        if (!cancelled) {

          setError(
            err?.message ||
            "Unable to load states."
          );

        }

      } finally {

        if (!cancelled) {

          setLoadingStates(false);

        }

      }

    }


    loadStates();


    return () => {

      cancelled = true;

    };

  }, []);


  // ==========================================================
  // LOAD DISTRICTS
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    if (!selectedState) {

      setDistricts([]);
      setTaluks([]);

      return;

    }


    async function loadDistricts() {

      try {

        setLoadingDistricts(true);
        setError("");


        const data =
          await api.getDistricts(
            Number(selectedState)
          );


        if (!cancelled) {

          setDistricts(
            Array.isArray(data)
              ? data
              : []
          );

        }

      } catch (err) {

        if (!cancelled) {

          setDistricts([]);

          setError(
            err?.message ||
            "Unable to load districts."
          );

        }

      } finally {

        if (!cancelled) {

          setLoadingDistricts(false);

        }

      }

    }


    loadDistricts();


    return () => {

      cancelled = true;

    };

  }, [selectedState]);


  // ==========================================================
  // LOAD TALUKS
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    if (!selectedDistrict) {

      setTaluks([]);

      return;

    }


    async function loadTaluks() {

      try {

        setLoadingTaluks(true);
        setError("");


        const data =
          await api.getTaluks(
            Number(selectedDistrict)
          );


        if (!cancelled) {

          setTaluks(
            Array.isArray(data)
              ? data
              : []
          );

        }

      } catch (err) {

        if (!cancelled) {

          setTaluks([]);

          setError(
            err?.message ||
            "Unable to load taluks."
          );

        }

      } finally {

        if (!cancelled) {

          setLoadingTaluks(false);

        }

      }

    }


    loadTaluks();


    return () => {

      cancelled = true;

    };

  }, [selectedDistrict]);


  // ==========================================================
  // SYNC VALUE
  // ==========================================================

  useEffect(() => {

    if (!value) {
      return;
    }


    setSelectedState(
      value.stateId ?? ""
    );


    setSelectedDistrict(
      value.districtId ?? ""
    );


    setSelectedTaluk(
      value.talukId ?? ""
    );

  }, [
    value?.stateId,
    value?.districtId,
    value?.talukId,
  ]);


  // ==========================================================
  // STATE CHANGE
  // ==========================================================

  const handleStateChange = (
    event
  ) => {

    const stateId =
      event.target.value;


    setSelectedState(stateId);

    setSelectedDistrict("");
    setSelectedTaluk("");

    setDistricts([]);
    setTaluks([]);


    onChange?.(null);

  };


  // ==========================================================
  // DISTRICT CHANGE
  // ==========================================================

  const handleDistrictChange = (
    event
  ) => {

    const districtId =
      event.target.value;


    setSelectedDistrict(
      districtId
    );

    setSelectedTaluk("");

    setTaluks([]);


    onChange?.(null);

  };


  // ==========================================================
  // TALUK CHANGE
  // ==========================================================

  const handleTalukChange = (
    event
  ) => {

    const talukId =
      event.target.value;


    setSelectedTaluk(
      talukId
    );


    if (!talukId) {

      onChange?.(null);

      return;

    }


    const state =
      states.find(
        (item) =>
          String(item.id) ===
          String(selectedState)
      );


    const district =
      districts.find(
        (item) =>
          String(item.id) ===
          String(selectedDistrict)
      );


    const taluk =
      taluks.find(
        (item) =>
          String(item.id) ===
          String(talukId)
      );


    onChange?.({

      stateId:
        Number(selectedState),

      stateName:
        state?.name || "",

      districtId:
        Number(selectedDistrict),

      districtName:
        district?.name || "",

      talukId:
        Number(talukId),

      talukName:
        taluk?.name || "",

    });

  };


  const selectClass = `
    w-full
    rounded-xl
    border
    border-[#E8E2D8]
    bg-white
    px-3
    py-2.5
    text-[13px]
    text-[#1F3144]
    outline-none
    transition
    focus:border-[#0B7A33]
    focus:ring-2
    focus:ring-[#0B7A33]/20
    disabled:bg-[#F5F3EF]
    disabled:text-[#9A9489]
  `;


  return (

    <div className="space-y-3">

      {/* STATE */}

      <div>

        <label
          htmlFor="location-state"
          className="
            mb-1
            block
            text-[10px]
            font-medium
            text-[#7A8598]
          "
        >
          State
        </label>


        <select
          id="location-state"
          value={selectedState}
          onChange={handleStateChange}
          disabled={loadingStates}
          className={selectClass}
        >

          <option value="">

            {loadingStates
              ? "Loading States..."
              : "Select State"}

          </option>


          {states.map(
            (state) => (

              <option
                key={state.id}
                value={state.id}
              >
                {state.name}
              </option>

            )
          )}

        </select>

      </div>


      {/* DISTRICT */}

      <div>

        <label
          htmlFor="location-district"
          className="
            mb-1
            block
            text-[10px]
            font-medium
            text-[#7A8598]
          "
        >
          District
        </label>


        <select
          id="location-district"
          value={selectedDistrict}
          onChange={handleDistrictChange}
          disabled={
            !selectedState ||
            loadingDistricts
          }
          className={selectClass}
        >

          <option value="">

            {loadingDistricts
              ? "Loading Districts..."
              : !selectedState
                ? "Select State First"
                : "Select District"}

          </option>


          {districts.map(
            (district) => (

              <option
                key={district.id}
                value={district.id}
              >
                {district.name}
              </option>

            )
          )}

        </select>

      </div>


      {/* TALUK */}

      <div>

        <label
          htmlFor="location-taluk"
          className="
            mb-1
            block
            text-[10px]
            font-medium
            text-[#7A8598]
          "
        >
          Taluk
        </label>


        <select
          id="location-taluk"
          value={selectedTaluk}
          onChange={handleTalukChange}
          disabled={
            !selectedDistrict ||
            loadingTaluks
          }
          className={selectClass}
        >

          <option value="">

            {loadingTaluks
              ? "Loading Taluks..."
              : !selectedDistrict
                ? "Select District First"
                : "Select Taluk"}

          </option>


          {taluks.map(
            (taluk) => (

              <option
                key={taluk.id}
                value={taluk.id}
              >
                {taluk.name}
              </option>

            )
          )}

        </select>

      </div>


      {/* ERROR */}

      {error && (

        <p
          className="
            text-[11px]
            leading-relaxed
            text-[#C62828]
          "
        >
          {error}
        </p>

      )}

    </div>

  );

}