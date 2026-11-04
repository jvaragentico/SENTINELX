import { defineChain } from 'viem';
export const chain = defineChain({id:46630,name:'Robinhood Chain Testnet',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:['https://rpc.testnet.chain.robinhood.com']}},blockExplorers:{default:{name:'Blockscout',url:'https://explorer.testnet.chain.robinhood.com'}},testnet:true});
export const explorer = chain.blockExplorers.default.url;
export const monitored = [
 {name:'L2 Gateway Router',address:'0x77bF00A6A90c600f214b34BAFBB7918c0cF113A8',description:'Canonical Robinhood Chain testnet L2 Gateway Router'},
 {name:'L2 Proxy Admin',address:'0xE743e696B00789Ef489cF617477771764E9283a0',description:'Canonical Robinhood Chain testnet L2 Proxy Admin'},
] as const;
