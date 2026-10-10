import { api } from "./api.js";

// O servidor é a fonte do perfil; o cache mantém compatibilidade com os módulos existentes.
export function cacheProfile(user) {
  localStorage.setItem("nightcallProfile", JSON.stringify(user));
  localStorage.setItem("nightcallName", user.name);
  localStorage.setItem("nightcallUsername", user.username);
  localStorage.setItem("nightcallAvatar", user.avatar);
}
export async function authenticate() {
  const page = document.getElementById("authPage");
  const root = document.getElementById("applicationRoot");
  const status = document.getElementById("authStatus");
  const login = document.getElementById("loginForm");
  const register = document.getElementById("registerForm");
  const showUser = (user) => {
    cacheProfile(user);
    page.hidden = true;
    root.hidden = false;
  };
  document.getElementById("authSwitch").addEventListener("click", (event) => {
    register.hidden = !register.hidden;
    login.hidden = !register.hidden;
    event.currentTarget.textContent = register.hidden
      ? "Criar uma conta"
      : "Já tenho uma conta";
    status.textContent = "";
  });
  document
    .getElementById("logoutButton")
    .addEventListener("click", async (event) => {
      event.currentTarget.disabled = true;
      try {
        await api("/api/auth/logout", { method: "POST" });
        for (const key of [
          "nightcallProfile",
          "nightcallName",
          "nightcallUsername",
          "nightcallAvatar",
        ])
          localStorage.removeItem(key);
        location.reload();
      } catch (error) {
        event.currentTarget.disabled = false;
        alert(error.message);
      }
    });
  try {
    const { user } = await api("/api/auth/me");
    showUser(user);
    return user;
  } catch (error) {
    status.textContent =
      error.status === 401
        ? ""
        : "Servidor indisponível. Tente entrar novamente.";
  }
  page.hidden = false;
  return new Promise((resolve) => {
    for (const [form, endpoint] of [
      [login, "login"],
      [register, "register"],
    ]) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        status.textContent = "Conectando…";
        try {
          const { user } = await api("/api/auth/" + endpoint, {
            method: "POST",
            body: JSON.stringify(Object.fromEntries(new FormData(form))),
          });
          form.reset();
          showUser(user);
          resolve(user);
        } catch (error) {
          status.textContent = error.message;
        } finally {
          button.disabled = false;
        }
      });
    }
  });
}
