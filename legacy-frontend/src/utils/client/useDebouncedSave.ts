import { LabelData } from "@/types/types";
import { debounce } from "@mui/material";
import { useRef } from "react";

const useDebouncedSave = (
  setLabelData: React.Dispatch<React.SetStateAction<LabelData>>,
  delay: number = 300,
) => {
  return useRef(
    debounce((key: keyof LabelData, value: LabelData[keyof LabelData]) => {
      if (value) {
        setLabelData((prevData) => ({
          ...prevData,
          [key]: value,
        }));
      }
    }, delay),
  ).current;
};

export default useDebouncedSave;
