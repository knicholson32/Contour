
export type Type =
  | Success
  | Failure

// Create a basic API interface that all other APIs will extend
interface base {
  action: string
}

export interface Success extends base {
  ok: true;
}

export interface Failure extends base {
  ok: false;
  name: string
  message: string
}

export const formFailure = (action: string, name: string, message: string): Type => {
  const val = {
    action,
    name,
    ok: false,
    message
  };
  console.log('formFailure', val);
  return val; 
}

export const formSuccess = (action: string): Type => {
  return {
    action,
    ok: true,
  };
}