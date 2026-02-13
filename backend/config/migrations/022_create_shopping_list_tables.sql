-- Create shopping_lists table
CREATE TABLE IF NOT EXISTS `shopping_lists` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `user_id` INT,
    `settings` JSON,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create shopping_list_items table
CREATE TABLE IF NOT EXISTS `shopping_list_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `list_id` INT NOT NULL,
    `brand` VARCHAR(100) NOT NULL,
    `model` VARCHAR(255) NOT NULL,
    `quantity` INT DEFAULT 1,
    `is_checked` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    FOREIGN KEY (`list_id`) REFERENCES `shopping_lists` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
