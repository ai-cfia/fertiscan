"use client";
import { InspectionData } from "@/utils/server/backend";
import { CircularProgress, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import InspectionElement from "./InspectionElement";

/**
 * Props for the InspectionList component.
 *
 * @interface InspectionListProps
 * @property {string} search - The search term used to filter the inspection list.
 * @property {InspectionData[]} inspectionList - The list of inspection data to be displayed.
 */
interface InspectionListProps {
  search: string;
  inspectionList: InspectionData[];
}

/**
 * Component that renders a list of inspections filtered by a search term.
 *
 * @component
 * @param {InspectionListProps} props - The properties for the InspectionList component.
 * @param {string} props.search - The search term to filter the inspection list.
 * @param {InspectionData[]} props.inspectionList - The list of inspections to display.
 * @returns {JSX.Element} The rendered component.
 */
const InspectionList = ({ search, inspectionList }: InspectionListProps) => {
  const [shownList, setShownList] = useState([] as InspectionData[]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Navigates to the label inspections page for the given inspection ID.
  const handleInspectionClick = (id: string) => {
    router.push(`/label-inspections/${id}`);
  };

  // Filter the inspection list based on the search term.
  useEffect(() => {
    setShownList(
      inspectionList.filter((inspection) => {
        return inspection
          .product_name!.toLowerCase()
          .includes(search.toLowerCase());
      }),
    );
    setLoading(false);
  }, [inspectionList, search]);

  return (
    <Stack
      spacing={2}
      className={
        "h-full overflow-y-auto pb-4 pl-0" +
        (loading ? "flex items-center" : "")
      }
    >
      {loading ? (
        <CircularProgress color={"secondary"} />
      ) : (
        shownList.map((inspection) => {
          return (
            <InspectionElement
              inspection={inspection}
              key={inspection.id}
              handleClick={() => handleInspectionClick(inspection.id)}
            />
          );
        })
      )}
    </Stack>
  );
};

export default InspectionList;
