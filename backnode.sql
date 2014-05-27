/*
SQLyog Enterprise - MySQL GUI v8.1 
MySQL - 5.5.35-0+wheezy1 : Database - node
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

CREATE DATABASE /*!32312 IF NOT EXISTS*/`node` /*!40100 DEFAULT CHARACTER SET latin1 */;

USE `node`;

/*Table structure for table `adminuser` */

DROP TABLE IF EXISTS `adminuser`;

CREATE TABLE `adminuser` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `surname` varchar(45) NOT NULL,
  `picture` blob,
  `email` varchar(45) DEFAULT NULL,
  `address` varchar(45) DEFAULT NULL,
  `phone` int(11) DEFAULT NULL,
  `creationtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `customerid` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `custid` (`customerid`),
  CONSTRAINT `adminuser_ibfk_1` FOREIGN KEY (`customerid`) REFERENCES `customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_adminuser_user1` FOREIGN KEY (`id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8;

/*Data for the table `adminuser` */

insert  into `adminuser`(id,name,surname,picture,email,address,phone,creationtime,customerid) values (28,'jhon','doe',NULL,'jhon@example.com','Some where in la Mancha',2147483647,'2014-05-26 09:33:20',6),(29,'jhon','doe',NULL,'jhon@example.com','Some where in la Mancha',2147483647,'2014-05-26 09:34:41',6),(30,'jhon','doe',NULL,'jhon@example.com','Some where in la Mancha',2147483647,'2014-05-26 09:35:37',6),(31,'jhon','doe',NULL,'jhon@example.com','Some where in la Mancha',2147483647,'2014-05-26 09:35:56',6),(33,'jhon','doe',NULL,'jhon@example.com','Some where in la Mancha',2147483647,'2014-05-26 09:42:14',6),(34,'jhon','doe',NULL,'jhon@example.com','Some where in la Mancha',2147483647,'2014-05-26 10:08:22',6),(36,'jhon','doe',NULL,'jhon@example.com','Some where in la Mancha',2147483647,'2014-05-26 10:18:32',6),(37,'jhon','doe',NULL,'jhon@example.com','Some where in la Mancha',2147483647,'2014-05-26 10:18:37',6),(38,'jhon','doe',NULL,'jhon@example.com','Some where in la Mancha',2147483647,'2014-05-26 10:19:01',6),(39,'jhon','doe',NULL,'jhon@example.com','Some where in la Mancha',2147483647,'2014-05-26 10:27:20',6);

/*Table structure for table `branch` */

DROP TABLE IF EXISTS `branch`;

CREATE TABLE `branch` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `phone` int(11) DEFAULT NULL,
  `address` int(11) DEFAULT NULL,
  `email` varchar(45) DEFAULT NULL,
  `creationtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `customerid` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_fk_idx` (`customerid`),
  CONSTRAINT `customer_idx` FOREIGN KEY (`customerid`) REFERENCES `customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `branch` */

/*Table structure for table `branchesperadmin` */

DROP TABLE IF EXISTS `branchesperadmin`;

CREATE TABLE `branchesperadmin` (
  `adminid` int(11) NOT NULL,
  `branchid` int(11) NOT NULL,
  `creationtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `branchid` (`branchid`),
  KEY `adminid` (`adminid`),
  CONSTRAINT `branchesperadmin_ibfk_1` FOREIGN KEY (`branchid`) REFERENCES `branch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `branchesperadmin_ibfk_2` FOREIGN KEY (`adminid`) REFERENCES `adminuser` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `branchesperadmin` */

/*Table structure for table `customer` */

DROP TABLE IF EXISTS `customer`;

CREATE TABLE `customer` (
  `id` int(11) NOT NULL,
  `maxbranches` int(11) NOT NULL,
  `maxemployees` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_customer_user1` FOREIGN KEY (`id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `customer` */

insert  into `customer`(id,maxbranches,maxemployees) values (6,4,200);

/*Table structure for table `employee` */

DROP TABLE IF EXISTS `employee`;

CREATE TABLE `employee` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `creationtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `name` varchar(45) NOT NULL,
  `surname` varchar(45) DEFAULT NULL,
  `picture` blob,
  `customerid` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `custid` (`customerid`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`customerid`) REFERENCES `customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `employee` */

/*Table structure for table `user` */

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(45) DEFAULT NULL,
  `passwd` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8;

/*Data for the table `user` */

insert  into `user`(id,username,passwd) values (6,'boss','5b41ef64937f7b6fdbe9fd7239b320'),(28,'user-51.0725726140663','316cde92ecfc406fe5aa84cd5b2d9a'),(29,'user-3.6578619852662086','316cde92ecfc406fe5aa84cd5b2d9a'),(30,'user-9.83605137469974','316cde92ecfc406fe5aa84cd5b2d9a'),(31,'user-28.421864518895745','316cde92ecfc406fe5aa84cd5b2d9a'),(33,'user-63.39316668454558','316cde92ecfc406fe5aa84cd5b2d9a'),(34,'user-59.74422972649336','316cde92ecfc406fe5aa84cd5b2d9a'),(36,'user-27.623696441428613','316cde92ecfc406fe5aa84cd5b2d9a'),(37,'user-43.68561424332361','316cde92ecfc406fe5aa84cd5b2d9a'),(38,'user-1.2775008025909251','316cde92ecfc406fe5aa84cd5b2d9a'),(39,'user-63.729218230582774','316cde92ecfc406fe5aa84cd5b2d9a');

/*Table structure for table `workingtime` */

DROP TABLE IF EXISTS `workingtime`;

CREATE TABLE `workingtime` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empid` int(11) NOT NULL,
  `checkinpic` mediumblob,
  `checkin` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `checkout` timestamp NULL DEFAULT NULL,
  `checkoutpic` mediumblob,
  `branchid` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `empid` (`empid`),
  KEY `fk_workingtime_branch1_idx` (`branchid`),
  CONSTRAINT `fk_workingtime_branch1` FOREIGN KEY (`branchid`) REFERENCES `branch` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `workingtime_ibfk_1` FOREIGN KEY (`empid`) REFERENCES `employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `workingtime` */

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
