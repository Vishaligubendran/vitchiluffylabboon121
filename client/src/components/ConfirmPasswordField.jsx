export function passwordsMatch(password, confirmPassword) {
  return (
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword
  );
}

export default function ConfirmPasswordField({
  label = 'Confirm Password',
  password,
  confirmPassword,
  onChange,
  placeholder,
  autoComplete = 'new-password',
  required = true,
}) {
  const showTick = passwordsMatch(password, confirmPassword);

  return (
    <div className="field">
      <label>{label}</label>
      <div className={`input-with-match-icon${showTick ? ' is-match' : ''}`}>
        <input
          className="form-input"
          type="password"
          value={confirmPassword}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
        />
        {showTick && (
          <span className="password-match-tick" aria-label="Passwords match" title="Passwords match">
            ✓
          </span>
        )}
      </div>
    </div>
  );
}
