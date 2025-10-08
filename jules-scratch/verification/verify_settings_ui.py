from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    # Read the user script content
    with open('moocs-sharp.js', 'r', encoding='utf-8') as f:
        script_content = f.read()

    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the target page
        page.goto('https://moocs.iniad.org/portal', wait_until='domcontentloaded')

        # Inject the user script
        page.add_script_tag(content=script_content)

        # 1. Verify settings button and open modal
        settings_button = page.locator('button.ms-settings-button')
        expect(settings_button).to_be_visible(timeout=10000)
        settings_button.click()

        modal_overlay = page.locator('.ms-settings-modal-overlay')
        expect(modal_overlay).to_be_visible()

        # Verify all setting rows are present
        expect(page.get_by_text('レインボーアニメーション')).to_be_visible()
        expect(page.get_by_text('レイアウト調整機能')).to_be_visible()
        expect(page.get_by_text('カスタムアラート機能')).to_be_visible()
        expect(page.get_by_text('その他スタイル改善')).to_be_visible()

        # 2. Take screenshot of the initial state
        page.screenshot(path='jules-scratch/verification/verification_before.png')
        print("Screenshot 'verification_before.png' taken.")

        # 3. Toggle the 'Rainbow Animation' setting off
        # The page will reload automatically upon change
        rainbow_toggle_label = page.locator('.ms-settings-row', has_text='レインボーアニメーション').locator('.ms-toggle-switch')

        with page.expect_navigation():
            rainbow_toggle_label.click()
        print("Toggled 'Rainbow Animation' off. Page reloaded.")

        # 4. After reload, inject script again and verify the state is saved
        page.add_script_tag(content=script_content)

        settings_button_after = page.locator('button.ms-settings-button')
        expect(settings_button_after).to_be_visible()
        settings_button_after.click()

        modal_overlay_after = page.locator('.ms-settings-modal-overlay')
        expect(modal_overlay_after).to_be_visible()

        # Check if the toggle is now off
        rainbow_input_after = page.locator('.ms-settings-row', has_text='レインボーアニメーション').locator('input[type="checkbox"]')
        expect(rainbow_input_after).not_to_be_checked()
        print("Verified 'Rainbow Animation' is off after reload.")

        # 5. Take screenshot of the final state
        page.screenshot(path='jules-scratch/verification/verification_after.png')
        print("Screenshot 'verification_after.png' taken.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path='jules-scratch/verification/error.png')

    finally:
        browser.close()

if __name__ == '__main__':
    with sync_playwright() as p:
        run_verification(p)