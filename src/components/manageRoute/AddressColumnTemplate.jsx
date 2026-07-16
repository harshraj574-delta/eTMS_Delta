import React from "react";

// Truncated address cell with full text in a tooltip.
// Pass Address (capital A) — also used for Location via Address={...}.
const AddressColumnTemplate = React.memo((rowData) => {
  const maxLength = 40;
  const fullText = rowData.Address || "";
  const trimmedText =
    fullText.length > maxLength
      ? fullText.slice(0, maxLength) + "..."
      : fullText;

  return (
    <span
      data-pr-tooltip={fullText}
      data-pr-position="top"
      className="mr-ellipsis mr-ellipsis-200"
    >
      {trimmedText}
    </span>
  );
});

export default AddressColumnTemplate;
