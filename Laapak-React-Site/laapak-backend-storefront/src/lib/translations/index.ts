
export type TranslationDict = typeof translations.en

export const translations = {
    en: {
        account: {
            nav: {
                title: "My Account",
                overview: "Overview",
                profile: "Profile",
                addresses: "Addresses",
                orders: "Orders",
                logout: "Log out",
                hello: "Hello {name}",
            },
            overview: {
                welcome: "Welcome back, {name}",
                profile_completion: "Profile Completion",
                completed: "Completed",
                addresses_count: "Saved Addresses",
                recent_orders: "Recent Orders",
                view_all: "View All",
                table: {
                    date: "Date",
                    order_id: "Order #",
                    amount: "Amount",
                    status: "Status",
                },
                logged_in_as: "Logged in as:",
                order_date: "Order Date",
                order_number: "Order Number",
                total_amount: "Total Amount",
                go_to_order: "Go to order #{id}",
                no_recent_orders: "No recent orders",
                start_shopping: "Start shopping now",
            },
            orders: {
                none_title: "Nothing to see here",
                none_description: "You don't have any orders yet, let's change that :)",
                continue_shopping: "Continue shopping",
                card: {
                    date_format: "en-US",
                    items: "{count} items",
                    item: "{count} item",
                    more: "more",
                    details: "See details",
                }
            },
            profile: {
                name: {
                    label: "Name",
                    first_name: "First name",
                    last_name: "Last name",
                },
                email: {
                    label: "Email",
                },
                phone: {
                    label: "Phone number",
                },
                password: {
                    label: "Password",
                    security_note: "The password is not shown for security reasons",
                    old: "Old password",
                    new: "New password",
                    confirm: "Confirm new password",
                },
                billing: {
                    label: "Billing address",
                    none: "No billing address",
                }
            },
            address: {
                new: "New address",
                add: "Add address",
                edit: "Edit address",
                remove: "Remove",
                first_name: "First name",
                last_name: "Last name",
                company: "Company",
                address: "Address",
                apartment: "Apartment, suite, etc.",
                postal_code: "Postal code",
                city: "City",
                province: "Province / State",
                phone: "Phone",
                save: "Save",
            },
            transfer: {
                title: "Order transfers",
                subtitle: "Can't find the order you are looking for?",
                description: "Connect an order to your account.",
                order_id: "Order ID",
                request: "Request transfer",
                success_title: "Transfer for order {id} requested",
                success_desc: "Transfer request email sent to {email}",
            },
            login: {
                title: "Welcome back",
                description: "Sign in to your account for a personalized shopping experience.",
                email: "Email",
                email_required: "Please enter a valid email address.",
                password: "Password",
                submit: "Sign in",
                not_member: "Not a member?",
                join: "Join us",
            },
            register: {
                title: "Join the Laapak family",
                description: "Create an account now to enjoy exclusive benefits and an unmatched shopping experience.",
                first_name: "First name",
                last_name: "Last name",
                email: "Email",
                phone: "Phone",
                password: "Password",
                agreement: "By creating an account, you agree to our",
                privacy_policy: "Privacy Policy",
                and: "and",
                terms_of_use: "Terms of Use",
                submit: "Join now",
                already_member: "Already a member?",
                sign_in: "Sign in",
            },
            info: {
                edit: "Edit",
                cancel: "Cancel",
                save: "Save changes",
                success: "Updated successfully",
                error: "An error occurred, please try again",
            }
        }
    },
    ar: {
        account: {
            nav: {
                title: "حسابي",
                overview: "نظرة عامة",
                profile: "الملف الشخصي",
                addresses: "العناوين",
                orders: "الطلبات",
                logout: "تسجيل الخروج",
                hello: "أهلاً بك يا {name}",
            },
            overview: {
                welcome: "أهلاً بك يا {name} في لابك",
                profile_completion: "الملف الشخصي",
                completed: "مكتمل",
                addresses_count: "العناوين المسجلة",
                recent_orders: "الطلبات الأخيرة",
                view_all: "عرض الكل",
                table: {
                    date: "التاريخ",
                    order_id: "رقم الطلب",
                    amount: "المبلغ",
                    status: "الحالة",
                },
                logged_in_as: "تم تسجيل الدخول باسم:",
                order_date: "تاريخ الطلب",
                order_number: "رقم الطلب",
                total_amount: "إجمالي المبلغ",
                go_to_order: "الانتقال إلى طلب #{id}",
                no_recent_orders: "لا توجد طلبات حديثة",
                start_shopping: "ابدأ التسوق الآن",
            },
            orders: {
                none_title: "لا يوجد طلبات حالياً",
                none_description: "لم تقم بإجراء أي طلبات بعد، دعنا نغير ذلك :)",
                continue_shopping: "مواصلة التسوق",
                card: {
                    date_format: "ar-EG",
                    items: "{count} قطع",
                    item: "{count} قطعة",
                    more: "أكثر",
                    details: "عرض التفاصيل",
                }
            },
            profile: {
                name: {
                    label: "الاسم",
                    first_name: "الاسم الأول",
                    last_name: "اسم العائلة",
                },
                email: {
                    label: "البريد الإلكتروني",
                },
                phone: {
                    label: "رقم الهاتف",
                },
                password: {
                    label: "كلمة المرور",
                    security_note: "لا يتم عرض كلمة المرور لأسباب أمنية",
                    old: "كلمة المرور القديمة",
                    new: "كلمة المرور الجديدة",
                    confirm: "تأكيد كلمة المرور الجديدة",
                },
                billing: {
                    label: "عنوان الفواتير",
                    none: "لا يوجد عنوان فواتير",
                }
            },
            address: {
                new: "عنوان جديد",
                add: "إضافة عنوان",
                edit: "تعديل العنوان",
                remove: "إزالة",
                first_name: "الاسم الأول",
                last_name: "اسم العائلة",
                company: "الشركة",
                address: "العنوان",
                apartment: "شقة، جناح، إلخ",
                postal_code: "الرمز البريدي",
                city: "المدينة",
                province: "الولاية / المحافظة",
                phone: "الهاتف",
                save: "حفظ",
            },
            transfer: {
                title: "نقل الطلبات",
                subtitle: "لا يمكنك العثور على الطلب الذي تبحث عنه؟",
                description: "قم بربط طلب بحسابك.",
                order_id: "رقم الطلب",
                request: "طلب نقل",
                success_title: "تم طلب النقل للطلب {id}",
                success_desc: "تم إرسال بريد طلب النقل إلى {email}",
            },
            login: {
                title: "أهلاً بك مجدداً",
                description: "سجل دخولك الآن لتستمتع بتجربة تسوق مخصصة وسلسة.",
                email: "البريد الإلكتروني",
                email_required: "الرجاء إدخال بريد إلكتروني صحيح.",
                password: "كلمة المرور",
                submit: "تسجيل الدخول",
                not_member: "لست عضواً؟",
                join: "انضم إلينا",
            },
            register: {
                title: "انضم إلى عائلة لابك",
                description: "أنشئ حسابك الآن لتتمتع بمزايا حصرية وتجربة تسوق لا مثيل لها.",
                first_name: "الاسم الأول",
                last_name: "الاسم الأخير",
                email: "البريد الإلكتروني",
                phone: "رقم الهاتف",
                password: "كلمة المرور",
                agreement: "بإنشاء حساب، أنت توافق على",
                privacy_policy: "سياسة الخصوصية",
                and: "و",
                terms_of_use: "الشروط والأحكام",
                submit: "إنضم الآن",
                already_member: "لديك حساب بالفعل؟",
                sign_in: "تسجيل الدخول",
            },
            info: {
                edit: "تعديل",
                cancel: "إلغاء",
                save: "حفظ التغييرات",
                success: "تم التحديث بنجاح",
                error: "حدث خطأ، يرجى المحاولة مرة أخرى",
            }
        }
    }
}

/**
 * Simple translation helper
 */
export const getTranslation = (locale: string = "ar") => {
    const dict = translations[locale as keyof typeof translations] || translations.ar

    return (path: string, variables: Record<string, any> = {}) => {
        const keys = path.split(".")
        let value: any = dict

        for (const key of keys) {
            value = value?.[key]
        }

        if (typeof value !== "string") {
            return path
        }

        // Replace variables like {name}
        Object.entries(variables).forEach(([key, val]) => {
            value = value.replace(new RegExp(`{${key}}`, 'g'), val)
        })

        return value
    }
}

/**
 * Hook for client-side translations
 */
export const useTranslation = (locale: string = "ar") => {
    return {
        t: getTranslation(locale),
        locale
    }
}
