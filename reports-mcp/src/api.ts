import axios from "axios";
import { API_BASE_URL, API_KEY } from "./constants.js";

/**
 * Shared utility for making API requests to the Laapak Report System
 */
export async function makeApiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any,
  params?: any
): Promise<T> {
  try {
    const url = endpoint.startsWith('/') ? `${API_BASE_URL}${endpoint}` : `${API_BASE_URL}/${endpoint}`;
    
    const response = await axios({
      method,
      url,
      data,
      params,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-api-key": API_KEY
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Shared utility for formatting API errors into user-friendly strings
 */
export function handleApiError(error: any): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const serverMessage = error.response.data?.message || error.response.data?.error || '';
      const messageSuffix = serverMessage ? `: ${serverMessage}` : '';
      
      switch (error.response.status) {
        case 404:
          return `Error: Resource not found. Please check your query or ID${messageSuffix}`;
        case 401:
        case 403:
          return `Error: Permission denied. API Key may be invalid or missing privileges${messageSuffix}`;
        case 400:
          return `Error: Bad Request. Check your input parameters${messageSuffix}`;
        case 429:
          return "Error: Rate limit exceeded. Please wait before making more requests.";
        default:
          return `Error: API request failed with status ${error.response.status}${messageSuffix}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "Error: Request timed out. Please try again.";
    }
  }
  return `Error: Unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`;
}
