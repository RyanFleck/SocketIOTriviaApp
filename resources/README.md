# Resources

Express can serve static files using the following command:

```
app.use(express.static('resources'))
```

Anything placed in this folder will now be available at `{site}/xyz.ext`. The *resources* directory is treated as the root of the filesystem.