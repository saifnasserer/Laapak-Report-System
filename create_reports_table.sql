-- Create Reports Table
CREATE TABLE IF NOT EXISTS `reports` (
  -- Basic Information
  `id` VARCHAR(50) PRIMARY KEY,
  `clientId` INT NOT NULL,
  `clientName` VARCHAR(100),
  `clientPhone` VARCHAR(20),
  `clientEmail` VARCHAR(100),
  `clientAddress` TEXT,
  `orderNumber` VARCHAR(20) NOT NULL,
  `deviceModel` VARCHAR(100) NOT NULL,
  `serialNumber` VARCHAR(100),
  `inspectionDate` DATE NOT NULL,
  
  -- Notes
  `notes` TEXT,
  
  -- Billing Information
  `billingEnabled` BOOLEAN DEFAULT FALSE,
  `amount` DECIMAL(10,2) DEFAULT 0,
  
  -- Status and Metadata
  `status` ENUM('pending', 'in-progress', 'completed', 'active') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);
