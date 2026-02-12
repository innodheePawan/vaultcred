
(async () => {
    try {
        const otplib = await import('otplib');
        console.log('otplib exports:', otplib);
        console.log('otplib.totp:', otplib.totp);
        console.log('otplib.default:', otplib.default);
        if (otplib.default) {
            console.log('otplib.default.totp:', otplib.default.totp);
        }
    } catch (e) {
        console.error(e);
    }
})();
