"""Generate notification illustrations using Pillow and CairoSVG.

Icons in notification-icons are Lucide paths matching the app's lucide-react icons.
"""

import io
import math
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "public"
WIDTH, HEIGHT = 1200, 600
LOGO = Image.open(ROOT / "icons/notification.png").convert("RGBA")
ICONS = Path(__file__).resolve().parent / "notification-icons"

SCENES = {
    "welcome_back": ("WELCOME BACK", "", "", "return"),
    "goal_nearly_complete": ("NEARLY THERE", "", "", "goal-near"),
    "goal_complete": ("GOAL COMPLETE", "", "", "goal-done"),
    "league_promotion_zone": ("PROMOTION ZONE", "", "", "zone"),
    "weekly_review": ("WEEKLY REVIEW", "", "", "review"),
    "daily_plan": ("TODAY'S PLAN", "", "", "daily"),
    "task_reminder": ("A LITTLE NUDGE", "Your next step", "is waiting for you.", "task"),
    "test": ("HELLO THERE!", "Can you hear us?", "Your reminders are ready.", "test"),
    "focus_complete": ("FOCUS COMPLETE", "Look at you go!", "Time for a well-earned break.", "focus"),
    "league_week_started": ("A FRESH START", "A new week awaits", "Let's make a little progress.", "start"),
    "league_week_ending": ("YOUR LEAGUE", "One more day", "Look how far you've come.", "ending"),
    "league_promoted": ("LEAGUE PROMOTION", "You moved up!", "Your hard work made a splash.", "promoted"),
    "league_demoted": ("A FRESH START", "There's always", "another wave to catch.", "demoted"),
    "league_stay": ("WEEKLY RESULTS", "Look at you go!", "Every small step counts.", "stay"),
}


def orb(image, center, size, mood="happy"):
    x, y = center
    ball = LOGO.resize((size, size), Image.Resampling.LANCZOS)
    image.alpha_composite(ball, (x - size // 2, y - size // 2))
    draw = ImageDraw.Draw(image)
    s = size / 200
    color = (4, 45, 78, 255)
    for dx in (-22, 22):
        px = x + int(dx * s)
        draw.ellipse((px - 4*s, y - 3*s, px + 4*s, y + 9*s), fill=color)
    if mood == "sad":
        draw.arc((x - 13*s, y + 21*s, x + 13*s, y + 38*s), 190, 350, fill=color, width=max(2, int(3*s)))
        draw.line((x - 31*s, y - 12*s, x - 16*s, y - 17*s), fill=color, width=max(2, int(3*s)))
        draw.line((x + 16*s, y - 17*s, x + 31*s, y - 12*s), fill=color, width=max(2, int(3*s)))
    else:
        draw.arc((x - 14*s, y + 12*s, x + 14*s, y + 33*s), 10, 170, fill=color, width=max(2, int(3*s)))


def icon(image, name, x, y, size):
    png = cairosvg.svg2png(url=str(ICONS / f"{name}.svg"), output_width=size, output_height=size)
    image.alpha_composite(Image.open(io.BytesIO(png)).convert("RGBA"), (x, y))


def render(key, label, title, subtitle, scene, light=False):
    image = Image.new("RGBA", (WIDTH, HEIGHT))
    pixels = image.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            t = (x / WIDTH + y / HEIGHT) / 2
            pixels[x, y] = (
                (int(237 - 17*t), int(246 - 17*t), int(250 - 12*t), 255)
                if light else
                (int(6 + 8*t), int(47 + 48*t), int(79 + 53*t), 255)
            )
    draw = ImageDraw.Draw(image, "RGBA")
    # The smooth layered waves use the same colours and rhythm as TopbarWater.
    for offset, amplitude, phase, color in (
        (490, 24, 0, (83, 159, 190, 50)),
        (525, 20, math.pi, (142, 202, 230, 65)),
    ):
        points = [(x, offset - amplitude * math.sin(x * math.pi / 300 + phase)) for x in range(0, WIDTH + 1, 5)]
        draw.polygon(points + [(WIDTH, HEIGHT), (0, HEIGHT)], fill=color)
    if scene == "promoted":
        # The app's orb celebrates from a small podium.
        # The column extends below the frame; the foreground wave hides its base.
        draw.rectangle((802, 376, 988, HEIGHT), fill=(45, 112, 141, 255))
        draw.rectangle((802, 376, 825, HEIGHT), fill=(65, 139, 164, 255))
        draw.rectangle((970, 376, 988, HEIGHT), fill=(32, 88, 119, 255))
        draw.ellipse((802, 359, 988, 393), fill=(116, 187, 208, 255), outline=(170, 221, 234, 255), width=2)
        for x, y, size in ((750, 135, 10), (1080, 245, 8), (790, 390, 7), (1030, 115, 6)):
            draw.line((x-size, y, x+size, y), fill=(218, 245, 255, 210), width=3)
            draw.line((x, y-size, x, y+size), fill=(218, 245, 255, 210), width=3)
        orb(image, (895, 277), 240)
        draw = ImageDraw.Draw(image, "RGBA")
        draw.ellipse((978, 315, 1090, 427), fill=(6, 55, 80, 255), outline=(255, 221, 125, 255), width=3)
        icon(image, "trophy", 1001, 338, 66)
        points = [
            (x, 525 - 20 * math.sin(x * math.pi / 300 + math.pi))
            for x in range(0, WIDTH + 1, 5)
        ]
        draw.polygon(points + [(WIDTH, HEIGHT), (0, HEIGHT)], fill=(142, 202, 230, 255))
    elif scene == "demoted":
        # A companion stays close, with the main orb in its usual position.
        orb(image, (895, 285), 310, "sad")
        orb(image, (1065, 345), 135, "happy")
        draw = ImageDraw.Draw(image, "RGBA")
        draw.arc((752, 375, 1050, 474), 185, 350, fill=(142, 202, 230, 190), width=4)
        draw.arc((785, 402, 1017, 482), 185, 350, fill=(142, 202, 230, 110), width=3)
        for x, y in ((1050, 185), (1090, 250)):
            draw.line((x-7, y, x+7, y), fill=(189, 231, 242, 170), width=2)
            draw.line((x, y-7, x, y+7), fill=(189, 231, 242, 170), width=2)
    elif scene in ("return", "goal-near", "goal-done", "zone", "review", "daily"):
        orb(image, (895, 285), 310)
        draw = ImageDraw.Draw(image, "RGBA")
        if scene == "return":
            orb(image, (1070, 350), 120)
            icon(image, "waves", 1000, 130, 85)
        elif scene in ("goal-near", "goal-done"):
            icon(image, "target", 1010, 330, 90)
            draw.rounded_rectangle((780, 435, 1010, 450), radius=7, fill=(83, 159, 190, 255))
            draw.rounded_rectangle((780, 435, 1010 if scene == "goal-done" else 964, 450), radius=7, fill=(142, 202, 230, 255))
            if scene == "goal-done":
                icon(image, "sparkles", 1030, 140, 65)
        elif scene == "zone":
            icon(image, "trophy", 1015, 330, 80)
            icon(image, "arrow-up", 1020, 140, 70)
        elif scene == "review":
            icon(image, "chart", 1015, 330, 85)
            icon(image, "sparkles", 1040, 155, 55)
        else:
            icon(image, "sun", 1020, 135, 80)
            icon(image, "calendar", 1010, 345, 80)
    else:
        orb(image, (895, 285), 310, "happy")
        draw = ImageDraw.Draw(image, "RGBA")
        if scene in ("stay", "start"):
            icon(image, "trophy", 1000, 320, 85)
        elif scene in ("task", "test", "ending"):
            draw.ellipse((1005, 135, 1115, 245), fill=(255, 216, 120, 255))
            icon(image, "bell", 1030, 160, 60)
        else:
            draw.ellipse((1015, 135, 1110, 230), fill=(255, 229, 148, 255))
            icon(image, "moon", 1032, 152, 60)
    suffix = "-light" if light else ""
    # Trim empty vertical space, preserving the round characters and the waterline.
    image = image.crop((0, 60, WIDTH, 572)).resize((900, 384), Image.Resampling.LANCZOS)
    image.convert("RGB").save(
        ROOT / "images" / f"notification-{key.replace('_', '-')}{suffix}.webp",
        quality=85,
        method=6,
    )


for name, values in SCENES.items():
    render(name, *values)
    render(name, *values, light=True)
