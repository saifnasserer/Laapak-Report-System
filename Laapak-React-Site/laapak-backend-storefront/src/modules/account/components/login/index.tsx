import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"
import { useTranslation } from "@lib/translations"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)
  const { t } = useTranslation()

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-2xl font-bold mb-4 tracking-tight">{t("account.login.title")}</h1>
      <p className="text-center text-ui-fg-subtle mb-8 max-w-[280px]">
        {t("account.login.description")}
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={t("account.login.email")}
            name="email"
            type="email"
            title={t("account.login.email_required")}
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label={t("account.login.password")}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6 bg-laapak-green hover:bg-laapak-green/90 text-white">
          {t("account.login.submit")}
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6 flex gap-1 justify-center">
        {t("account.login.not_member")}{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline text-laapak-green"
          data-testid="register-button"
        >
          {t("account.login.join")}
        </button>
      </span>
    </div>
  )
}

export default Login
