import { postJSON } from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";

export async function adminLogin(email, password) {
  const response = await postJSON(
    `${API_URL}/admin/login`,
    {
      email,
      password,
    }
  );

  return response.admin;
}