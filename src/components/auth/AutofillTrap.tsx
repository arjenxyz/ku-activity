/** Form üstüne ekleyin — tarayıcı otomatik doldurmayı yanlış alana yönlendirir */
export function AutofillTrap() {
  return (
    <div className="absolute -left-[9999px] w-0 h-0 overflow-hidden opacity-0" aria-hidden="true">
      <input tabIndex={-1} type="text" name="prevent_autofill_username" autoComplete="username" />
      <input tabIndex={-1} type="password" name="prevent_autofill_password" autoComplete="current-password" />
    </div>
  );
}
