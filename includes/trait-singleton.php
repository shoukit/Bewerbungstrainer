<?php
/**
 * Singleton Trait
 *
 * Provides a reusable singleton pattern for all classes that need
 * a single instance throughout the application lifecycle.
 *
 * Usage:
 * class MyClass {
 *     use Bewerbungstrainer_Singleton;
 *
 *     private function __construct() {
 *         // Initialize
 *     }
 * }
 *
 * // Get instance
 * $instance = MyClass::get_instance();
 *
 * @package Bewerbungstrainer
 * @since 1.5.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Trait Bewerbungstrainer_Singleton
 *
 * Implements the singleton pattern with protection against
 * cloning and unserialization.
 */
trait Bewerbungstrainer_Singleton {

    /**
     * The single instance of the class.
     *
     * @var static|null
     */
    private static $instance = null;

    /**
     * Gets the single instance of the class.
     *
     * Creates the instance if it doesn't exist yet.
     *
     * @return static The single instance.
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Prevent cloning of the instance.
     *
     * @return void
     */
    private function __clone() {}

    /**
     * Prevent unserializing of the instance.
     *
     * @throws Exception Always throws to prevent unserialization.
     * @return void
     */
    public function __wakeup() {
        throw new Exception('Cannot unserialize a singleton.');
    }
}
