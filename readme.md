## Setup

Download [nvm](https://github.com/coreybutler/nvm-windows/releases).  <br>

列出可安装的 node 版本:  
``` bash
nvm list available
```

安装指定的版本，建议使用最新的LTS（长期服务）版本:
``` bash
nvm install XX.XX.X
```

使用指定的版本: 
``` bash
nvm use XX.XX.X
```

Download Yarn: 
``` bash
npm install --global yarn
```

Run this followed commands:<br>

``` bash
# Install dependencies (only the first time)
yarn install

# Run the local server at localhost:8080
yarn dev

# Build for production in the dist/ directory
yarn build
```
