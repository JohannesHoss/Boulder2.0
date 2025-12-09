// Boulder 2.0 - Scriptable Widget
// Shows current leading day, location, and participants
//
// Setup:
// 1. Install Scriptable app on iOS
// 2. Create new script and paste this code
// 3. Add widget to home screen, select this script

const API_URL = 'https://boulder20backend-production.up.railway.app/api/leading';

async function fetchLeading() {
    try {
        const req = new Request(API_URL);
        req.timeoutInterval = 10;
        const data = await req.loadJSON();
        return data;
    } catch (e) {
        console.error('Failed to fetch:', e);
        return null;
    }
}

function createWidget(data) {
    const widget = new ListWidget();
    widget.backgroundColor = new Color('#111b21');
    widget.setPadding(12, 12, 12, 12);

    // Header
    const header = widget.addStack();
    header.layoutHorizontally();
    header.centerAlignContent();

    const icon = header.addText('🧗');
    icon.font = Font.systemFont(16);

    header.addSpacer(6);

    const title = header.addText('Boulder 2.0');
    title.textColor = new Color('#25d366');
    title.font = Font.boldSystemFont(14);

    header.addSpacer();

    const weekText = header.addText(`W${data?.weekNumber || '?'}`);
    weekText.textColor = new Color('#8696a0');
    weekText.font = Font.systemFont(12);

    widget.addSpacer(8);

    if (!data || !data.success) {
        const errorText = widget.addText('Could not load data');
        errorText.textColor = new Color('#ea4335');
        errorText.font = Font.systemFont(12);
        return widget;
    }

    // Leading Day(s)
    const dayStack = widget.addStack();
    dayStack.layoutHorizontally();
    dayStack.centerAlignContent();

    const dayIcon = dayStack.addText('📅');
    dayIcon.font = Font.systemFont(13);

    dayStack.addSpacer(6);

    if (data.leadingDays && data.leadingDays.length > 0) {
        const dayTexts = data.leadingDays.map(d => `${d.short} ${d.date}`);
        const dayValue = dayStack.addText(dayTexts.join(' / '));
        dayValue.textColor = Color.white();
        dayValue.font = Font.mediumSystemFont(13);

        dayStack.addSpacer(4);

        const dayCount = dayStack.addText(`(${data.leadingDays[0].count})`);
        dayCount.textColor = new Color('#8696a0');
        dayCount.font = Font.systemFont(11);
    } else {
        const noDay = dayStack.addText('No votes yet');
        noDay.textColor = new Color('#8696a0');
        noDay.font = Font.systemFont(13);
    }

    widget.addSpacer(4);

    // Leading Location(s)
    const locStack = widget.addStack();
    locStack.layoutHorizontally();
    locStack.centerAlignContent();

    const locIcon = locStack.addText('📍');
    locIcon.font = Font.systemFont(13);

    locStack.addSpacer(6);

    if (data.leadingLocations && data.leadingLocations.length > 0) {
        const locTexts = data.leadingLocations.map(l => l.short);
        const locValue = locStack.addText(locTexts.join(' / '));
        locValue.textColor = Color.white();
        locValue.font = Font.mediumSystemFont(13);
        locValue.lineLimit = 1;

        locStack.addSpacer(4);

        const locCount = locStack.addText(`(${data.leadingLocations[0].count})`);
        locCount.textColor = new Color('#8696a0');
        locCount.font = Font.systemFont(11);
    } else {
        const noLoc = locStack.addText('-');
        noLoc.textColor = new Color('#8696a0');
        noLoc.font = Font.systemFont(13);
    }

    widget.addSpacer(4);

    // Time
    const timeStack = widget.addStack();
    timeStack.layoutHorizontally();
    timeStack.centerAlignContent();

    const timeIcon = timeStack.addText('⏰');
    timeIcon.font = Font.systemFont(13);

    timeStack.addSpacer(6);

    const timeValue = timeStack.addText('18:30 Uhr');
    timeValue.textColor = Color.white();
    timeValue.font = Font.mediumSystemFont(13);

    widget.addSpacer(6);

    // Going (participants)
    if (data.going && data.going.length > 0) {
        const goingStack = widget.addStack();
        goingStack.layoutHorizontally();
        goingStack.centerAlignContent();

        const goingIcon = goingStack.addText('👥');
        goingIcon.font = Font.systemFont(12);

        goingStack.addSpacer(6);

        const goingValue = goingStack.addText(data.going.join(', '));
        goingValue.textColor = new Color('#8696a0');
        goingValue.font = Font.systemFont(11);
        goingValue.lineLimit = 2;
    }

    widget.addSpacer();

    // Tap to open app
    widget.url = 'https://boulder20-production.up.railway.app';

    return widget;
}

// Main execution
const data = await fetchLeading();
const widget = createWidget(data);

if (config.runsInWidget) {
    Script.setWidget(widget);
} else {
    // Preview in app
    widget.presentMedium();
}

Script.complete();
