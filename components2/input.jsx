export default function Input({ id, type = "text", pro, value, logic, must }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{pro}</label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={value}
        onChange={logic}
        required={must}
        autoComplete={
          type === "password"
            ? id === "confirm" ? "new-password" : "current-password"
            : type === "email" ? "email" : "username"
        }
      />
    </div>
  );
}
