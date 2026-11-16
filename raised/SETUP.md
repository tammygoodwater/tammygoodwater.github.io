# Raised: Setup and Launch Guide

Raised is a fundraising graphic maker for nonprofits. It runs in any browser and installs on phones like a regular app, for free.

**Live link (after publishing):** https://tammygoodwater.github.io/raised/

| File | What it is |
| --- | --- |
| `index.html` | The app screen: words, buttons, colors |
| `app.js` | How the graphics are drawn (styles, layouts) |
| `config.js` | **Your settings:** price, payment link, unlock code, email |
| `manifest.webmanifest`, `sw.js`, `icons/` | What makes it installable and work offline |

---

## How it makes money

* **Free version:** Progress bar and Ring styles. Every image carries a small "Made with Raised" label, so each post a nonprofit shares advertises your app.
* **Pro version (one-time payment):** removes the label and unlocks logo upload plus the Thermometer and Milestones styles.

Payments go through **Stripe**. You pay no monthly fee, just about 2.9% + 30¢ per sale.

---

## Step 1: Turn on payments (about 20 minutes)

1. Create a free account at **stripe.com** and finish the identity and bank details so payouts can reach you.
2. In Stripe, go to **Product catalog → Add product**. Name it "Raised Pro", set a **one-time** price (for example $29), and save.
3. Go to **Payment Links → New**, then choose the Raised Pro product.
4. Under **After payment**, choose **Don't show confirmation page → Redirect customers to your website**, and enter:
   `https://tammygoodwater.github.io/raised/?unlock=RAISEDPRO2026`
   (use your own code if you changed it in `config.js`).
5. Optional but recommended: under **Advanced options → Custom message on receipt**, add "Your unlock code: RAISEDPRO2026. Enter it in the app if you switch phones." That way buyers can unlock Pro again on a new device.
6. Copy the Payment Link (it starts with `https://buy.stripe.com/`).
7. Open `config.js` and paste it between the quotes after `paymentLink:`. Update `price` to match Stripe. Add your `contactEmail` if you'd like custom-design inquiries.
8. Publish the change (ask Claude, or upload the file to GitHub).

**Test it first:** Stripe has a **Test mode** switch. Make a test Payment Link, pay with card `4242 4242 4242 4242`, and check that you land back in the app with Pro unlocked.

## Step 2: Install it on your phone

* **iPhone:** open the link in Safari → Share button → **Add to Home Screen**.
* **Android:** open it in Chrome → tap **Install app** (or the menu → Install).

## Step 3: Get your first customers

1. Make 3–4 sample graphics for real local nonprofits you know (with permission) and post them to your portfolio and social accounts.
2. Email nonprofit contacts you've designed for: "I built a free tool that makes your fundraising updates look professional."
3. Post in nonprofit communities: Facebook groups for nonprofit communications and development staff, r/nonprofit, and local nonprofit associations (such as the Nebraska nonprofit association).
4. Time it right: **Giving Tuesday (early December)** and **year-end giving (December)** are when nonprofits post the most progress updates.
5. Add a link to Raised on your portfolio site so clients find it too.

---

## Good to know

* **Unlock security is basic.** The unlock code is stored in the app, so a tech-savvy person could find it. That's normal for a $0 first version. Change the code now and then (in `config.js` and in your Stripe redirect). If sales grow, Claude can help you move to real license keys (for example with Lemon Squeezy or Gumroad).
* **Privacy:** nonprofits' numbers and logos never leave their device. That's a good selling point, so mention it.
* **After changing any file,** open `sw.js` and bump the version (`raised-v1` → `raised-v2`) so installed apps pick up the update.
* **Later: the app stores.** Once Raised is earning money, the same app can be wrapped for Google Play ($25 one time) and the Apple App Store ($99/year) with a free tool such as PWABuilder.com.
