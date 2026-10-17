# Free household bill check (personal website)

A one-page website for friends and prospects: they fill in their energy, broadband, mobile,
home insurance & cover and car insurance details, get an instant **bill health check**, and send
it to you by email (Web3Forms), WhatsApp or their own email app.

No server, no build step, no cookies or tracking - it runs free on **GitHub Pages**.

## 1. Your settings (once)

Open **`config.js`** and fill in:

| Setting | What to put |
|---|---|
| `whatsapp` | Your mobile in international format, digits only, e.g. `447700900123` |
| `web3formsKey` | Go to https://web3forms.com, enter `er.arunbaag@gmail.com`, copy the **Access Key** from the email and paste it here. Every sent bill check then lands in your inbox. |
| `partnerId`, `area` | Optional - shown in the footer |
| `priceCap` | Update each quarter (Ofgem) so the energy check stays right |
| `welcomeBonus` | Current UW welcome bonus tiers - set `{}` to hide |

You can edit `config.js` straight on github.com (open the file > pencil icon > *Commit changes*); the site updates in about a minute.

## 2. Publish with GitHub Desktop

1. GitHub Desktop > **File > Add local repository** > choose this folder > *create a repository* if asked > **Create repository**.
2. **Publish repository** - untick *Keep this code private* (GitHub Pages is free for public repos) > Publish.
3. On github.com open the repository > **Settings > Pages** > *Source: Deploy from a branch* > Branch **main** / **(root)** > Save.
4. After 1-2 minutes your site is at `https://<your-github-username>.github.io/<repository-name>/`. Share that link.

After any change: GitHub Desktop > write a summary > **Commit to main** > **Push origin**.

## 3. Bringing a submission into your Partner Hub

Each Web3Forms email contains a readable summary plus a `hub_import_json` field. In the Hub,
**Customer tab > Import from website** - paste that JSON (or the whole email text) and the customer form fills itself
with lead source *Website*.

## Good to know

* Customer details are **never stored in this repository** - only in their browser until they press Send, then in your inbox.
* Keep the footer wording: it says this is the personal site of an Authorised UW Partner, not the official UW website,
  and that the check is a guide only. Check UW's current Partner rules on personal websites and social media before sharing widely.
* You are the data controller for what people send you (UK GDPR) - keep it safe and delete it when asked or after the retention period in `privacy.html`.
