const { Setting } = require('../../models');

async function initializeTemplates() {
    try {
        const templates = [
            {
                key: 'template_warranty_alert_6m',
                value: '🛠️ *تذكير بالصيانة المجانية*\n\nأهلاً {{client_name}}،\n\nنود تذكيركم بموعد *صيانة كل 6 أشهر* لجهازكم (*{{device_model}}*) في تاريخ *{{warranty_date}}*.\n\nيرجى العلم أن لديكم مهلة أسبوع قبل أو بعد هذا التاريخ للاستفادة من الصيانة المجانية، بعد ذلك سيتم احتساب رسوم على الصيانة.\n\nيرجى التواصل معنا لترتيب الموعد.\n\n_مع تحيات فريق عمل لابك_',
                type: 'string',
                description: 'WhatsApp template for 6-months warranty alert'
            },
            {
                key: 'template_warranty_alert_12m',
                value: '🛠️ *تذكير بالصيانة المجانية*\n\nأهلاً {{client_name}}،\n\nنود تذكيركم بموعد *صيانة سنوية* لجهازكم (*{{device_model}}*) في تاريخ *{{warranty_date}}*.\n\nيرجى العلم أن لديكم مهلة أسبوع قبل أو بعد هذا التاريخ للاستفادة من الصيانة المجانية، بعد ذلك سيتم احتساب رسوم على الصيانة.\n\nيرجى التواصل معنا لترتيب الموعد.\n\n_مع تحيات فريق عمل لابك_',
                type: 'string',
                description: 'WhatsApp template for 12-months warranty alert'
            },
            {
                key: 'template_report_ready',
                value: 'أهلاً {{client_name}}،\n\nالتقرير الخاص بجهازكم (*{{device_model}}*) دلوقتي جاهز تقدر تشوف تفاصيله كامله دلوقتي من هنا\nhttps://reports.laapak.com\n\nUsername: {{username}}\nPassword: {{password}}',
                type: 'string',
                description: 'WhatsApp template for when a report is ready'
            }
        ];

        for (const t of templates) {
            const [setting, created] = await Setting.findOrCreate({
                where: { key: t.key },
                defaults: t
            });
            if (created) {
                console.log(`✅ Created template: ${t.key}`);
            } else {
                console.log(`ℹ️ Template already exists: ${t.key}`);
            }
        }
        console.log('✅ Template initialization completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to initialize templates:', error);
        process.exit(1);
    }
}

initializeTemplates();
