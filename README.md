# Dota 2 Custom IHL
Create and customize your very own Dota 2 in house league with ease. Features include automatic match creation, an easily configurable web based match creator and more.


## Getting Started
### Use notes
Don't use this for anything ~~serious~~. Don't even try. The way it is now, this thing doesn't even run properly. You'd be lucky to get a single match going. Ok, you could probably get a few matches going, they just wouldn't be going the way you expected. Who knows what would happen really. It's not like we test this thing.

### Development
Alright boys this is it. First, you're going to want to install [node.js](https://nodejs.org/en/). The project should technically work with [io.js](https://iojs.org/en/) as well, but I'd rather be safe than sorry. Then, to get started on this project all you have to do is clone/fork the github repo and run ```npm install``` in the root directory. Remember to set your own API keys and bot logins/passwords/steam guard codes in ```config.json```. Everything _should_ work after that. If you're missing a dependency after that (it will tell you that it can't find a module/package) just ```npm install [module/package]``` and tell me what it was and I'll add it to package.json (or you can even do it yourself since you have commit permissions). After you get everything setup, run ```node web.js``` to make sure everything is working. You're also going to have to read through ```config.json```. You can leave the "comments" there if you want or remove them if you think they're ugly. Unfortunately, this is the only way to add comments to json...

## Development Roadmap

Alright so here's the plan:
  * Finish the frontend. That includes the logical side of it too. Make sure no one can messup a lobby by spamming it with requests. Thing's like that.
  * Make sure the scheduler behaves as intended. Basically make sure that multiple bots can run at the same time without a hitch and make sure that when they are done, they return to the pool of useable bots and are acutally used again.
  * Create/utilize a match parser. We don't actually have to create one if we use [Clarity](https://github.com/skadistats/clarity) (which is written in Java). The [YASP](https://github.com/yasp-dota/rapier) guys told me that a Javascript based match parser isn't even worth it, which is why they don't use one. I'd be interested to see performance comparissons though. Honestly, what parser to use is *very* low on the priority list. We just need *a* parser, doesn't matter which to the users.
     For a recap the choices are: 
      * Clarity
      * Our own match parser in Javascript
      * Our own match parser written in some other language (C# or C/C++ preferably)
