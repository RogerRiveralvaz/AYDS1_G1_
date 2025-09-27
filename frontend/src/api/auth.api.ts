import { apiClient } from "./client";
import type { SessionUser } from "../app/store/auth";
import type { UsuarioResumen } from "./types";

type LoginPayload = { email: string; password: string };
export type RegisterPayload = Record<string, unknown>;
type VerifyPayload = { email: string; codigo: string };

type LoginApiResponse = {
  access_token: string;
  refresh_token: string;
  usuario: UsuarioResumen;
};

type RegisterApiResponse = {
  message: string;
  usuario: UsuarioResumen & { codigo_verificacion?: string };
};

type VerifyApiResponse = { usuario: UsuarioResumen };

type LogoutApiResponse = { message: string };

function mapUsuario(usuario: UsuarioResumen): SessionUser {
  return usuario;
}

export async function login(payload: LoginPayload) {
  const { data } = await apiClient.post<LoginApiResponse>("/auth/login", payload);
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: mapUsuario(data.usuario),
  };
}

// NUEVO: permite JSON o FormData; si es FormData, usa multipart
export async function register(payload: Record<string, unknown> | FormData, isMultipart = false) {
  const headers = isMultipart ? { "Content-Type": "multipart/form-data" } : undefined;
  const { data } = await apiClient.post<RegisterApiResponse>("/auth/register", payload, { headers });
  return {
    message: data.message,
    user: mapUsuario(data.usuario),
  };
}


export async function verifyEmail(payload: VerifyPayload) {
  const { data } = await apiClient.post<VerifyApiResponse>("/auth/verify-email", payload);
  return mapUsuario(data.usuario);
}

export async function resendVerification(email: string) {
  const { data } = await apiClient.post<{ message: string; codigo?: string }>("/auth/resend-verification", { email });
  return data;
}

export async function requestPasswordReset(email: string) {
  const { data } = await apiClient.post<{ message: string; codigo?: string }>("/auth/request-password-reset", { email });
  return data;
}

export async function resetPassword(payload: { email: string; codigo: string; nueva_password: string }) {
  const { data } = await apiClient.post<{ message: string }>("/auth/reset-password", payload);
  return data;
}

export async function logout() {
  const { data } = await apiClient.post<LogoutApiResponse>("/auth/logout");
  return data;
}
