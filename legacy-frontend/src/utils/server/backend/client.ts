import { BACKEND_URL } from "../constants";
import {
  FilesApiFactory,
  InspectionsApiFactory,
  MonitoringApiFactory,
  PipelineApiFactory,
  UsersApiFactory,
} from "./api";
import { Configuration } from "./configuration";

const config = new Configuration({
  basePath: BACKEND_URL,
});

export const inspectionsApi = InspectionsApiFactory(config);
export const monitoringApi = MonitoringApiFactory(config);
export const pipelineApi = PipelineApiFactory(config);
export const usersApi = UsersApiFactory(config);
export const filesApi = FilesApiFactory(config);
