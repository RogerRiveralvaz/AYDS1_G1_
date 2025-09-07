import { useCallback, useMemo, useReducer } from "react";

import type { AccountStepValues } from "../components/RegisterAccountStep";
import type { RoleDetailsResult } from "../components/RegisterRoleStep";
import type { RegisterPayload } from "../../../api/auth.api";

type RegisterState = {
  step: "account" | "details" | "verify";
  account?: AccountStepValues;
  details?: RoleDetailsResult;
  tempVerificationCode?: string;
};

type Action =
  | { type: "SET_ACCOUNT"; payload: AccountStepValues }
  | { type: "SET_DETAILS"; payload: RoleDetailsResult }
  | { type: "SET_STEP"; payload: RegisterState["step"] }
  | { type: "SET_VERIFICATION"; payload?: string }
  | { type: "RESET" };

const initialState: RegisterState = {
  step: "account",
};

function reducer(state: RegisterState, action: Action): RegisterState {
  switch (action.type) {
    case "SET_ACCOUNT":
      return {
        ...state,
        account: action.payload,
        details: undefined,
        step: "details",
      };
    case "SET_DETAILS":
      return {
        ...state,
        details: action.payload,
        step: "verify",
      };
    case "SET_STEP":
      return {
        ...state,
        step: action.payload,
      };
    case "SET_VERIFICATION":
      return {
        ...state,
        tempVerificationCode: action.payload,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useRegisterFlow() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setAccount = useCallback((payload: AccountStepValues) => dispatch({ type: "SET_ACCOUNT", payload }), []);
  const setDetails = useCallback((payload: RoleDetailsResult) => dispatch({ type: "SET_DETAILS", payload }), []);
  const setStep = useCallback((payload: RegisterState["step"]) => dispatch({ type: "SET_STEP", payload }), []);
  const setVerificationCode = useCallback(
    (payload?: string) => dispatch({ type: "SET_VERIFICATION", payload }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const apiPayload: RegisterPayload | null = useMemo(() => {
    if (!state.account || !state.details) {
      return null;
    }
    const basePayload: RegisterPayload = {
      rol_codigo: state.account.rol_codigo,
      nombres: state.account.nombres,
      apellidos: state.account.apellidos,
      email: state.account.email,
      password: state.account.password,
    };

    const details = state.details;
    switch (details.rol) {
      case "CLIENTE":
        return {
          ...basePayload,
          telefono: details.telefono,
          direccion: {
            linea1: details.direccion.linea1,
            ciudad: details.direccion.ciudad,
            pais: details.direccion.pais,
            referencia: details.direccion.referencia,
          },
        };
      case "TIENDA":
        return {
          ...basePayload,
          tienda: {
            razon_social: details.razon_social,
            telefono: details.telefono,
            email: details.email_contacto,
            cuenta_bancaria: details.cuenta_bancaria,
            url_logo: details.url_logo || undefined,
            direccion: details.direccion,
          },
        };
      case "REPARTIDOR":
        return {
          ...basePayload,
          repartidor: {
            dpi: details.dpi,
            vehiculo_tipo: details.vehiculo_tipo,
            cuenta_bancaria: details.cuenta_bancaria,
            url_foto: details.url_foto,
            licencia_numero: details.licencia_numero || undefined,
            licencia_tipo: details.licencia_tipo || undefined,
            placa: details.placa || undefined,
          },
          telefono: details.telefono,
        };
      case "ADMIN":
        return {
          ...basePayload,
          telefono: details.telefono,
        };
      default:
        return basePayload;
    }
  }, [state.account, state.details]);

  return {
    state,
    setAccount,
    setDetails,
    setStep,
    setVerificationCode,
    reset,
    apiPayload,
  };
}
