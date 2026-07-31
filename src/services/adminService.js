import { postJSON } from "../config/api";

const API_URL = "http://localhost:5000/api";

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