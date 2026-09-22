// src/api/survey.js
import { post, get } from "./client";

export const submitSurvey = async (payload) => {
  const response = await post("/survey", payload);
  return response.data.data;
};

export const getMySurvey = async () => {
  const response = await get("/survey/me");
  return response.data.data;
};
