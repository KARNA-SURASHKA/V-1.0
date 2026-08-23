import {
  Ambulance,
  Hospital,
  PhoneCall,
  Building2,
} from "lucide-react";

import EmergencyCard from "./EmergencyCard";

export default function EmergencySection() {
  const contacts = [
    {
      icon: <Ambulance size={26} />,
      iconBg: "#FEECEC",
      iconColor: "#EF4444",
      title: "Ambulance",
      contact: "108",
      description:
        "24×7 emergency ambulance service for immediate medical assistance.",
      buttonText: "Call Now",
    },

    {
      icon: <Hospital size={26} />,
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
      title: "Nearby Hospital",
      contact: "Govt. Hospital",
      description:
        "Primary government healthcare facility serving your locality.",
      buttonText: "View Details",
    },

    {
      icon: <PhoneCall size={26} />,
      iconBg: "#ECFDF3",
      iconColor: "#16A34A",
      title: "Health Helpline",
      contact: "104",
      description:
        "Karnataka Health Helpline for medical guidance and disease reporting.",
      buttonText: "Call Now",
    },

    {
      icon: <Building2 size={26} />,
      iconBg: "#F5F3FF",
      iconColor: "#7C3AED",
      title: "Taluk Health Office",
      contact: "Virajpet THO",
      description:
        "Local disease surveillance office for public health support.",
      buttonText: "View Location",
    },
  ];

  return (
    <section className="space-y-6">

      {/* Heading */}

      <div>

        <h2 className="text-[42px] font-bold text-[#13264B]">
          Emergency Contacts
        </h2>

        <p className="mt-2 text-[17px] text-gray-500 leading-8">
          Quickly connect with healthcare and emergency support services available in your locality.
        </p>

      </div>

      {/* Four Cards */}

      <div className="grid grid-cols-4 gap-6">

        {contacts.map((item) => (
          <EmergencyCard
            key={item.title}
            {...item}
          />
        ))}

      </div>

    </section>
  );
}