---
title: "Sharing your house? Factory method pattern can help you"
date: "2013-10-16T14:12:03.284Z"
template: "post"
draft: false
slug: "/posts/sharing-your-house-factory-method-pattern-can-help-you"
category: "PHP"
tags:
  - "PHP"
  - "Design Patterns"
description: "An implementation of the Factory method pattern while maintaining a web-application developed in PHP and Zend Framework 1."
---

In a web-application that I developed in Zend Framework 1 and that I'm still maintaining, I had to face a challenge: the
client decided to move it to the cloud, and to abandon (finally!) the old and slow Linux hosting they had used for about
2 years. Well, you'll say, what's the problem? The application managed resources, and it had a **huge number of items
stored locally** on the same server, that are, 134,000 files!

They decided to use a new server with WebDav as the new resource pool. They decided to change the organisation of files,
creating a particular structure of sub-folders based on an ID assigned to each file. And they decided that this couldn't
be propagated immediately to all the environments (Dev, Staging and Production), but only to Dev initially. Therefore, I
had to find a way to maintain both the old and new way of storing files without breaking all, and to keep the code
consistent in the different environments.

The challenge could be compared to the difficulties of **cohabiting with other house mates**: different views,
dissimilar habits, and often various approaches to the most common things, like cooking, cleaning or using the TV! How
to make two "house mates" (local file system and WebDav) work together without arguing? And how, if in the future a
new "house mate" would come to stay with them, e.g. using SFTP as a file storage mechanism?

It was the good time to use again the **Factory method pattern**, one of the creational design patterns I like more. It
has been defined as follows:

> Define an interface for creating an object, but let the classes that implement the interface decide which class to
> instantiate. The Factory method lets a class defer instantiation to subclasses. ("Design Patterns" by the Gang of
> Four)

In other words, what I needed was to have an easy way to "switch" from a way of storing file to another. That's it!

I created a `FileStorageFactory` class, that would instantiate the appropriate storage engine to be used by the
application, depending on the configuration, so that my changes in the code would be minimal even if in the future a new
way of storing file (e.g. SFTP, Google Drive, etc.) would be added to the platform. See the sample code below:

[FileStorageFactory.php hosted with GitHub](https://gist.github.com/albertoarena/641cc352eb8bc8e17aae#file-filestoragefactory-php)

```php
/**
 * Class FileStorageFactory
 * A factory class that instantiates the appropriate FileStorage engine
 */
class MyProject_Service_FileStorageFactory
{
    /**
     * Available file storage mechanisms
     * I haven't implemented them all, but this gives an idea of how it
     * can be easy to add a new completely different way of storing file
     * @var array
     */
    protected static $mappings = array(
        'local'   => 'MyProject_Service_FileStorage_Local',
        'webdav'  => 'MyProject_Service_FileStorage_Webdav',
        'sftp'    => 'MyProject_Service_FileStorage_Sftp',
        'gdrive'  => 'MyProject_Service_FileStorage_GoogleDrive',
        'dropbox' => 'MyProject_Service_FileStorage_Dropbox'
    );

    /**
     * Cached file storage object
     * @var MyProject_Service_FileStorage_Abstract
     */
    protected static $cache = NULL;

    /**
     * Factory method
     *
     * @return MyProject_Service_FileStorage_Abstract
     */
    public static function factory()
    {
        if (self::$cache === NULL)
        {
            // Read the file storage type from the settings
            $type = MyProject_Configuration::get('filestorage');

            // Create the appropriate file storage
            if (array_key_exists($type, self::$mappings))
            {
                $className = self::$mappings[$type];
                self::$cache = new $className();
            }
            else
            {
                throw new Exception('FileStorageFactory: type ' . $type . ' not found');
            }
        }

        return self::$cache;
    }
}

/**
 * Abstract class FileStorage
 * A static file storage that uses the correct file storage mechanism, based on configuration
 *
 * Sub-classes implement the methods, e.g.
 * MyProject_Service_FileStorage_Local
 * MyProject_Service_FileStorage_WebDav
 * MyProject_Service_FileStorage_Sftp
 * etc.
 */
abstract class MyProject_Service_FileStorage_Abstract
{
  /**
   * Save a file
   * @param string $filename  file name on the local file system
   * @return bool|int         ID of the filename saved, or FALSE if it failed
   */
  abstract public function put($filename)
  {
    //
  }

  /**
   * Get a file
   * @param int $id           ID of the filename
   * @return bool|array       Filename info, or FALSE if it failed
   */
  abstract public function get($id)
  {
    //
  }

}
```

This approach allowed me to use the old way of saving files (local file system) only on some environments, and to switch
later to the e.g. WebDav, simply editing a setting in the configuration, and to have the same code deployed to all
different environments even if some of them kept using the old file storage for a certain time.

Of course, I had to write a script that moved the 134,000 files stored locally to the new file storage, once the
environment switched to it. But it was run only once, as soon as the shift happened, and nothing broke in the platform:
the resources were simply offline for a couple of minutes while running this maintenance task.

Using the Factory method pattern make your code be elegant, robust and well organised. It can help to solve challenges
similar to mine, without the need of countless "if/else" or "switch" statements to decide which approach has to be
followed or not. Also, this design pattern allows to refactor the code in a less risky way.

And, last but not least … it allowed **"house mates" to cohabit without arguing**! This wasn't too bad, was it?

## If you want to read more …

Factory method pattern on [Wikipedia](https://en.wikipedia.org/wiki/Factory_method_pattern)
