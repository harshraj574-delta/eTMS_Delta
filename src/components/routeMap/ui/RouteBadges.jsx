/* Small route attribute icons shown on route cards. */

export const VehicleIcon = ({ type, isActive }) => {
  const getVehicleImage = (type) => {
    switch (type) {
      case "s":
        return "images/icons/letter-s.png";
      case "m":
        return "images/icons/letter-m.png";
      case "l":
        return "images/icons/letter-l.png";
      default:
        return null;
    }
  };
  const imageSrc = getVehicleImage(type);
  if (!imageSrc) return null;
  return (
    <img
      src={imageSrc}
      alt={type.toUpperCase()}
      style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
      title={`${type.toUpperCase()} Vehicle`}
    />
  );
};

export const GuardIcon = ({ isActive }) => (
  <img
    src="images/icons/add_guard.png"
    alt="Guard"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Guard Required"
  />
);

export const SwappedIcon = ({ isActive }) => (
  <img
    src="images/icons/swap.png"
    alt="Swapped"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Swapped Route"
  />
);

export const PWDIcon = ({ isActive }) => (
  <img
    src="images/icons/pwd.png"
    alt="PWD"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="PWD"
  />
);

export const MedicalIcon = ({ isActive }) => (
  <img
    src="images/icons/medical.png"
    alt="Medical"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Medical Required"
  />
);

export const NonMotorableIcon = ({ isActive }) => (
  <img
    src="images/icons/non-motorable.png"
    alt="NMT"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Non Motorable"
  />
);
