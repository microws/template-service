import { MicrowsConfig } from "@microws/devops";
export default MicrowsConfig({
  bucket: "[@todo arn]",
  evidentlyArn: "[@todo arn]",
  globals: {
    "react/jsx-runtime": "Shared.jsxruntime",
    react: "Shared.react",
    "react-dom/client": "Shared.reactdomclient",
    "react-router-dom": "Shared.reactrouterdom",
    "@microws/web": "Shared.MicrowsWeb",
    "@microsoft/fetch-event-source": "Shared.SSE",
    "@tanstack/react-query": "Shared.query",
    dayjs: "Shared.dayjs",
    jotai: "Shared.jotai",
  },
});
