"use client";
import theme from "@/app/theme";
import FertilizerList from "@/components/inspection-list/InspectionList";
import useAlertStore from "@/stores/alertStore";
import { Search } from "@mui/icons-material";
import {
  Grid2 as Grid,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Dashboard component that displays user information and a list of inspections.
 *
 * @component
 * @returns {JSX.Element} The rendered Dashboard component.
 *
 * @state
 * - `search` - the search query string.
 * - `inspectList` - the list of inspections.
 * - `user` - the username of the logged-in user.
 *
 * @effect
 * - Fetches the username from cookies and sets it in the state.
 * - Fetches the list of inspections from the API and sets it in the state.
 */
const Dashboard = () => {
  const { t } = useTranslation("dashboard");
  const [search, setSearch] = useState("");
  const [inspectList, setInspectList] = useState([]);
  const { showAlert } = useAlertStore();
  const [user, setUser] = useState("");

  useEffect(() => {
    setUser(atob(Cookies.get("token") ?? ""));
    const username = atob(Cookies.get("token") ?? "");
    const password = "";
    const authHeader = "Basic " + btoa(`${username}:${password}`);
    axios
      .get("/api-next/inspections", {
        headers: {
          Authorization: authHeader,
        },
      })
      .then((response) => {
        setInspectList(response.data);
      })
      .catch((error) => {
        if (error.response.status === 401) {
          Cookies.remove("token");
          showAlert(t("error.unauthorizedAccess"), "error");
        }
        if (error.response.status === 404) {
          showAlert(t("error.noInspection"), "error");
        } else {
          showAlert(t("error.errorOccured"), "error");
        }
      });
  }, [showAlert, t]);

  return (
    <Grid
      container
      spacing={2}
      className={"h-[calc(100vh-65px)] p-5"}
      sx={{ backgroundColor: theme.palette.background.paper }}
    >
      <Grid size={{ xs: 12, sm: 4, md: 3 }}>
        <Grid
          data-testid={"user-info"}
          container
          className={"h-fit rounded-md border-2 border-gray-200 p-2"}
        >
          <Grid size={12}>
            <Typography component={"h2"} className={"!font-black text-black"}>
              {t("user-info.title")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <b className={"text-black"}>{t("user-info.username")}:</b>
          </Grid>
          <Grid className={"text-black"} size={6}>
            {user}
          </Grid>
        </Grid>
        <Grid
          container
          className={
            "mt-2 h-fit w-11/12 rounded-md border-2 border-gray-200 p-2"
          }
        >
          <Grid size={12}>
            <Typography
              component={"h4"}
              className={"!font-semiboldl text-black"}
            >
              {t("user-info.inspectionNumber")}: {inspectList.length}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid
        size={{ xs: 12, sm: 8, md: 9 }}
        className={
          "xs:pb-1 xs:h-[calc(100%-10.75rem)] min-h-60 rounded-md border-2 border-gray-200 p-2 sm:h-full sm:pb-0"
        }
      >
        <Grid container spacing={2} className={"h-full"}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography component={"h2"} className={"!font-black text-black"}>
              {t("list.my-inspections")}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 8 }}>
            <TextField
              placeholder={t("list.search")}
              variant={"filled"}
              className={"rounded-md"}
              sx={{
                backgroundColor: theme.palette.background.paper,
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              slotProps={{
                htmlInput: {
                  className: "!p-0 ",
                },
                input: {
                  className: "p-2 after:!transition-none ",
                  startAdornment: (
                    <InputAdornment position={"start"} className={"!m-0"}>
                      <Search
                        color="primary"
                        aria-label={t("alt.searchIcon")}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <hr className={"w-full"} />
          <Grid
            size={{ xs: 12 }}
            className={"xs:h-[calc(100%-8rem)] sm:h-[85%]"}
          >
            <FertilizerList search={search} inspectionList={inspectList} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
