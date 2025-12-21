<?php
/**
 * Categories Admin Class
 *
 * Admin interface for managing scenario categories
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Categories_Admin {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Database instance
     */
    private $db;

    /**
     * Available Lucide icons for categories
     */
    private $available_icons = array(
        'briefcase' => 'Briefcase (Aktentasche)',
        'users' => 'Users (Benutzer)',
        'trending-up' => 'Trending Up (Aufwärtstrend)',
        'message-circle' => 'Message Circle (Nachricht)',
        'headphones' => 'Headphones (Kopfhörer)',
        'heart' => 'Heart (Herz)',
        'target' => 'Target (Ziel)',
        'star' => 'Star (Stern)',
        'award' => 'Award (Auszeichnung)',
        'book-open' => 'Book Open (Buch)',
        'clipboard' => 'Clipboard (Zwischenablage)',
        'file-text' => 'File Text (Dokument)',
        'folder' => 'Folder (Ordner)',
        'zap' => 'Zap (Blitz)',
        'shield' => 'Shield (Schild)',
        'clock' => 'Clock (Uhr)',
        'dollar-sign' => 'Dollar Sign (Geld)',
        'mic' => 'Mic (Mikrofon)',
        'video' => 'Video (Video)',
        'phone' => 'Phone (Telefon)',
        'mail' => 'Mail (E-Mail)',
        'settings' => 'Settings (Einstellungen)',
        'check-circle' => 'Check Circle (Häkchen)',
        'alert-triangle' => 'Alert Triangle (Warnung)',
        'info' => 'Info (Information)',
        'help-circle' => 'Help Circle (Hilfe)',
    );

    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->db = Bewerbungstrainer_Categories_Database::get_instance();

        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'handle_form_submissions'));
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_submenu_page(
            'bewerbungstrainer',
            'Kategorien',
            'Kategorien',
            'manage_options',
            'bewerbungstrainer-categories',
            array($this, 'render_admin_page')
        );
    }

    /**
     * Handle form submissions
     */
    public function handle_form_submissions() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Create category
        if (isset($_POST['bewerbungstrainer_create_category']) && check_admin_referer('bewerbungstrainer_category_nonce')) {
            $this->handle_create_category();
        }

        // Update category
        if (isset($_POST['bewerbungstrainer_update_category']) && check_admin_referer('bewerbungstrainer_category_nonce')) {
            $this->handle_update_category();
        }

        // Delete category
        if (isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['id']) && check_admin_referer('delete_category_' . $_GET['id'])) {
            $this->handle_delete_category(intval($_GET['id']));
        }
    }

    /**
     * Handle create category
     */
    private function handle_create_category() {
        $data = array(
            'slug' => sanitize_title($_POST['slug'] ?? ''),
            'name' => sanitize_text_field($_POST['name'] ?? ''),
            'short_name' => sanitize_text_field($_POST['short_name'] ?? ''),
            'icon' => sanitize_text_field($_POST['icon'] ?? 'folder'),
            'color' => sanitize_hex_color($_POST['color'] ?? '#3b82f6'),
            'sort_order' => intval($_POST['sort_order'] ?? 0),
            'is_active' => isset($_POST['is_active']) ? 1 : 0,
        );

        // Generate slug from name if not provided
        if (empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = sanitize_title($data['name']);
        }

        $result = $this->db->create_category($data);

        if ($result) {
            add_settings_error('bewerbungstrainer_categories', 'success', 'Kategorie erfolgreich erstellt.', 'success');
        } else {
            add_settings_error('bewerbungstrainer_categories', 'error', 'Fehler beim Erstellen der Kategorie.', 'error');
        }
    }

    /**
     * Handle update category
     */
    private function handle_update_category() {
        $id = intval($_POST['category_id'] ?? 0);

        if (!$id) {
            add_settings_error('bewerbungstrainer_categories', 'error', 'Ungültige Kategorie-ID.', 'error');
            return;
        }

        $data = array(
            'slug' => sanitize_title($_POST['slug'] ?? ''),
            'name' => sanitize_text_field($_POST['name'] ?? ''),
            'short_name' => sanitize_text_field($_POST['short_name'] ?? ''),
            'icon' => sanitize_text_field($_POST['icon'] ?? 'folder'),
            'color' => sanitize_hex_color($_POST['color'] ?? '#3b82f6'),
            'sort_order' => intval($_POST['sort_order'] ?? 0),
            'is_active' => isset($_POST['is_active']) ? 1 : 0,
        );

        $result = $this->db->update_category($id, $data);

        if ($result !== false) {
            add_settings_error('bewerbungstrainer_categories', 'success', 'Kategorie erfolgreich aktualisiert.', 'success');
        } else {
            add_settings_error('bewerbungstrainer_categories', 'error', 'Fehler beim Aktualisieren der Kategorie.', 'error');
        }
    }

    /**
     * Handle delete category
     */
    private function handle_delete_category($id) {
        $result = $this->db->delete_category($id);

        if ($result) {
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-categories&deleted=1'));
            exit;
        } else {
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-categories&error=1'));
            exit;
        }
    }

    /**
     * Render admin page
     */
    public function render_admin_page() {
        $action = isset($_GET['action']) ? $_GET['action'] : 'list';
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

        // Show success/error messages
        if (isset($_GET['deleted'])) {
            echo '<div class="notice notice-success is-dismissible"><p>Kategorie erfolgreich gelöscht.</p></div>';
        }
        if (isset($_GET['error'])) {
            echo '<div class="notice notice-error is-dismissible"><p>Fehler bei der Aktion.</p></div>';
        }

        settings_errors('bewerbungstrainer_categories');

        switch ($action) {
            case 'new':
                $this->render_form();
                break;
            case 'edit':
                $category = $this->db->get_category($id);
                if ($category) {
                    $this->render_form($category);
                } else {
                    $this->render_list();
                }
                break;
            default:
                $this->render_list();
        }
    }

    /**
     * Render categories list
     */
    private function render_list() {
        $categories = $this->db->get_categories(array('is_active' => null));
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline">Kategorien</h1>
            <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-categories&action=new'); ?>" class="page-title-action">Neue Kategorie</a>
            <hr class="wp-header-end">

            <p class="description" style="margin: 15px 0;">
                Kategorien werden für alle Funktionsbereiche (Smart Briefing, Szenario-Training, Wirkungs-Analyse, Live-Simulationen) verwendet.
                Die Kategorie-Filter im Frontend zeigen nur Kategorien an, die auch Szenarien enthalten.
            </p>

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th style="width: 50px;">Icon</th>
                        <th>Name</th>
                        <th>Kurzname</th>
                        <th>Slug</th>
                        <th style="width: 80px;">Farbe</th>
                        <th style="width: 80px;">Sortierung</th>
                        <th style="width: 80px;">Status</th>
                        <th style="width: 150px;">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($categories)) : ?>
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 20px;">
                                Keine Kategorien vorhanden. <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-categories&action=new'); ?>">Erste Kategorie erstellen</a>
                            </td>
                        </tr>
                    <?php else : ?>
                        <?php foreach ($categories as $category) : ?>
                            <tr>
                                <td>
                                    <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: <?php echo esc_attr($category->color); ?>20;">
                                        <span style="font-size: 12px; color: <?php echo esc_attr($category->color); ?>;">
                                            <?php echo esc_html($category->icon); ?>
                                        </span>
                                    </span>
                                </td>
                                <td>
                                    <strong><?php echo esc_html($category->name); ?></strong>
                                </td>
                                <td><?php echo esc_html($category->short_name ?: '-'); ?></td>
                                <td><code><?php echo esc_html($category->slug); ?></code></td>
                                <td>
                                    <span style="display: inline-block; width: 24px; height: 24px; border-radius: 4px; background: <?php echo esc_attr($category->color); ?>; border: 1px solid #ddd;"></span>
                                </td>
                                <td><?php echo esc_html($category->sort_order); ?></td>
                                <td>
                                    <?php if ($category->is_active) : ?>
                                        <span style="color: #22c55e;">● Aktiv</span>
                                    <?php else : ?>
                                        <span style="color: #94a3b8;">○ Inaktiv</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-categories&action=edit&id=' . $category->id); ?>" class="button button-small">Bearbeiten</a>
                                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bewerbungstrainer-categories&action=delete&id=' . $category->id), 'delete_category_' . $category->id); ?>" class="button button-small" onclick="return confirm('Kategorie wirklich löschen?');">Löschen</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    /**
     * Render category form
     */
    private function render_form($category = null) {
        $is_edit = $category !== null;
        $title = $is_edit ? 'Kategorie bearbeiten' : 'Neue Kategorie';
        $button_text = $is_edit ? 'Aktualisieren' : 'Erstellen';
        $action_name = $is_edit ? 'bewerbungstrainer_update_category' : 'bewerbungstrainer_create_category';

        // Default values
        $data = array(
            'id' => $is_edit ? $category->id : 0,
            'slug' => $is_edit ? $category->slug : '',
            'name' => $is_edit ? $category->name : '',
            'short_name' => $is_edit ? $category->short_name : '',
            'icon' => $is_edit ? $category->icon : 'folder',
            'color' => $is_edit ? $category->color : '#3b82f6',
            'sort_order' => $is_edit ? $category->sort_order : 0,
            'is_active' => $is_edit ? $category->is_active : 1,
        );
        ?>
        <div class="wrap">
            <h1><?php echo esc_html($title); ?></h1>
            <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-categories'); ?>" class="page-title-action">← Zurück zur Liste</a>
            <hr class="wp-header-end">

            <form method="post" style="max-width: 800px; margin-top: 20px;">
                <?php wp_nonce_field('bewerbungstrainer_category_nonce'); ?>
                <?php if ($is_edit) : ?>
                    <input type="hidden" name="category_id" value="<?php echo esc_attr($data['id']); ?>">
                <?php endif; ?>

                <table class="form-table">
                    <tr>
                        <th><label for="name">Name *</label></th>
                        <td>
                            <input type="text" name="name" id="name" value="<?php echo esc_attr($data['name']); ?>" class="regular-text" required>
                            <p class="description">Vollständiger Name der Kategorie, z.B. "Bewerbung & Karriere"</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="short_name">Kurzname</label></th>
                        <td>
                            <input type="text" name="short_name" id="short_name" value="<?php echo esc_attr($data['short_name']); ?>" class="regular-text">
                            <p class="description">Kurzform für Filter-Buttons, z.B. "Karriere"</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="slug">Slug</label></th>
                        <td>
                            <input type="text" name="slug" id="slug" value="<?php echo esc_attr($data['slug']); ?>" class="regular-text" pattern="[a-z0-9-]+">
                            <p class="description">URL-freundlicher Name (wird automatisch generiert wenn leer). Nur Kleinbuchstaben, Zahlen und Bindestriche.</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="icon">Icon</label></th>
                        <td>
                            <select name="icon" id="icon">
                                <?php foreach ($this->available_icons as $icon_value => $icon_label) : ?>
                                    <option value="<?php echo esc_attr($icon_value); ?>" <?php selected($data['icon'], $icon_value); ?>>
                                        <?php echo esc_html($icon_label); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <p class="description">Lucide Icon-Name für die Anzeige im Frontend</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="color">Farbe</label></th>
                        <td>
                            <input type="color" name="color" id="color" value="<?php echo esc_attr($data['color']); ?>" style="width: 60px; height: 40px; padding: 0; border: 1px solid #ddd; border-radius: 4px;">
                            <input type="text" id="color_hex" value="<?php echo esc_attr($data['color']); ?>" class="small-text" style="margin-left: 10px;" readonly>
                            <p class="description">Farbe für die Kategorie-Badges</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="sort_order">Sortierung</label></th>
                        <td>
                            <input type="number" name="sort_order" id="sort_order" value="<?php echo esc_attr($data['sort_order']); ?>" class="small-text" min="0">
                            <p class="description">Niedrigere Zahlen werden zuerst angezeigt</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="is_active">Status</label></th>
                        <td>
                            <label>
                                <input type="checkbox" name="is_active" id="is_active" value="1" <?php checked($data['is_active'], 1); ?>>
                                Aktiv
                            </label>
                            <p class="description">Inaktive Kategorien werden nicht im Frontend angezeigt</p>
                        </td>
                    </tr>
                </table>

                <p class="submit">
                    <input type="submit" name="<?php echo esc_attr($action_name); ?>" class="button button-primary" value="<?php echo esc_attr($button_text); ?>">
                    <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-categories'); ?>" class="button">Abbrechen</a>
                </p>
            </form>

            <script>
                document.getElementById('color').addEventListener('input', function() {
                    document.getElementById('color_hex').value = this.value;
                });
            </script>
        </div>
        <?php
    }

    /**
     * Render category dropdown for other admin forms (single selection)
     * Static method so it can be called from other admin classes
     *
     * @param string $selected_slug Currently selected category slug
     * @param string $name Form field name
     * @param bool $required Whether the field is required
     * @deprecated Use render_category_checkboxes for multi-select
     */
    public static function render_category_dropdown($selected_slug = '', $name = 'category', $required = false) {
        $db = Bewerbungstrainer_Categories_Database::get_instance();
        $categories = $db->get_categories();

        $required_attr = $required ? 'required' : '';
        ?>
        <select name="<?php echo esc_attr($name); ?>" id="<?php echo esc_attr($name); ?>" <?php echo $required_attr; ?>>
            <option value="">-- Kategorie wählen --</option>
            <?php foreach ($categories as $category) : ?>
                <option value="<?php echo esc_attr($category->slug); ?>" <?php selected($selected_slug, $category->slug); ?>>
                    <?php echo esc_html($category->name); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <?php
    }

    /**
     * Render category checkboxes for other admin forms (multi-selection)
     * Static method so it can be called from other admin classes
     *
     * @param array|string $selected_slugs Currently selected category slugs (array or JSON string)
     * @param string $name Form field name (will add [] for array)
     * @param bool $required Whether at least one selection is required
     */
    public static function render_category_checkboxes($selected_slugs = array(), $name = 'categories', $required = false) {
        $db = Bewerbungstrainer_Categories_Database::get_instance();
        $categories = $db->get_categories();

        // Handle JSON string input
        if (is_string($selected_slugs)) {
            $decoded = json_decode($selected_slugs, true);
            $selected_slugs = is_array($decoded) ? $decoded : ($selected_slugs ? array($selected_slugs) : array());
        }

        // Ensure it's an array
        if (!is_array($selected_slugs)) {
            $selected_slugs = array();
        }

        $field_name = $name . '[]';
        $required_class = $required ? 'required-checkboxes' : '';
        ?>
        <div class="categories-checkboxes <?php echo esc_attr($required_class); ?>" id="<?php echo esc_attr($name); ?>_container" style="display: flex; flex-wrap: wrap; gap: 12px;">
            <?php foreach ($categories as $category) :
                $is_checked = in_array($category->slug, $selected_slugs);
                $checkbox_id = $name . '_' . $category->slug;
            ?>
                <label for="<?php echo esc_attr($checkbox_id); ?>" style="
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 14px;
                    border-radius: 8px;
                    border: 2px solid <?php echo $is_checked ? esc_attr($category->color) : '#e2e8f0'; ?>;
                    background: <?php echo $is_checked ? esc_attr($category->color) . '15' : '#fff'; ?>;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: <?php echo $is_checked ? '600' : '400'; ?>;
                    color: <?php echo $is_checked ? esc_attr($category->color) : '#475569'; ?>;
                ">
                    <input
                        type="checkbox"
                        name="<?php echo esc_attr($field_name); ?>"
                        id="<?php echo esc_attr($checkbox_id); ?>"
                        value="<?php echo esc_attr($category->slug); ?>"
                        <?php checked($is_checked); ?>
                        style="margin: 0;"
                        onchange="this.parentElement.style.borderColor = this.checked ? '<?php echo esc_attr($category->color); ?>' : '#e2e8f0'; this.parentElement.style.background = this.checked ? '<?php echo esc_attr($category->color); ?>15' : '#fff'; this.parentElement.style.fontWeight = this.checked ? '600' : '400'; this.parentElement.style.color = this.checked ? '<?php echo esc_attr($category->color); ?>' : '#475569';"
                    >
                    <span style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 20px;
                        height: 20px;
                        border-radius: 4px;
                        background: <?php echo esc_attr($category->color); ?>;
                        color: white;
                        font-size: 10px;
                    "><?php echo esc_html(substr($category->icon, 0, 2)); ?></span>
                    <?php echo esc_html($category->short_name ?: $category->name); ?>
                </label>
            <?php endforeach; ?>
        </div>
        <?php if ($required) : ?>
            <p class="description" style="margin-top: 8px; color: #64748b;">Mindestens eine Kategorie muss ausgewählt werden.</p>
        <?php endif; ?>
        <?php
    }

    /**
     * Parse categories from form submission
     * Static helper to handle both single and multi-select
     *
     * @param array|string $input The form input (can be array from checkboxes or string from dropdown)
     * @return string JSON encoded array of category slugs
     */
    public static function parse_categories_input($input) {
        if (is_array($input)) {
            // Multi-select checkboxes
            $slugs = array_map('sanitize_title', array_filter($input));
            return json_encode(array_values($slugs));
        } elseif (is_string($input) && !empty($input)) {
            // Single dropdown value - convert to array
            return json_encode(array(sanitize_title($input)));
        }
        return json_encode(array());
    }

    /**
     * Get categories array from stored value
     * Static helper to decode stored category data
     *
     * @param string|array $stored The stored value (JSON string or array)
     * @return array Array of category slugs
     */
    public static function get_categories_array($stored) {
        if (is_array($stored)) {
            return $stored;
        }
        if (is_string($stored)) {
            $decoded = json_decode($stored, true);
            if (is_array($decoded)) {
                return $decoded;
            }
            // Legacy: single string value
            return !empty($stored) ? array($stored) : array();
        }
        return array();
    }
}
