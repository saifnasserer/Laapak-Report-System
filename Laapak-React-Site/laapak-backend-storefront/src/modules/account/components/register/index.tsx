"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"
import { useTranslation } from "@lib/translations"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)
  const { t } = useTranslation()

  return (
    <div
      className="max-w-sm flex flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="text-2xl font-bold mb-4 tracking-tight text-center">
        {t("account.register.title")}
      </h1>
      <p className="text-center text-ui-fg-subtle mb-8 max-w-[320px]">
        {t("account.register.description")}
      </p>
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={t("account.register.first_name")}
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label={t("account.register.last_name")}
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label={t("account.register.email")}
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label={t("account.register.phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label={t("account.register.password")}
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="register-error" />
        <span className="text-center text-ui-fg-base text-small-regular mt-6">
          {t("account.register.agreement")}{" "}
          <LocalizedClientLink
            href="/privacy"
            className="underline hover:text-laapak-green"
          >
            {t("account.register.privacy_policy")}
          </LocalizedClientLink>{" "}
          {t("account.register.and")}{" "}
          <LocalizedClientLink
            href="/terms"
            className="underline hover:text-laapak-green"
          >
            {t("account.register.terms_of_use")}
          </LocalizedClientLink>
          .
        </span>
        <SubmitButton className="w-full mt-6 bg-laapak-green hover:bg-laapak-green/90 text-white" data-testid="register-button">
          {t("account.register.submit")}
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6 flex gap-1 justify-center">
        {t("account.register.already_member")}{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline text-laapak-green"
        >
          {t("account.register.sign_in")}
        </button>
      </span>
    </div>
  )
}

export default Register
