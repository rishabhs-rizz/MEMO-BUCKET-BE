export function Random(len: number){
    let Options = "sjasbbscbjcbufbcbkcnzjxcn";
    let length = Options.length;
    let ans = "";
    for (let i=0; i< len;i++){
        ans += Options[Math.floor((Math.random() * length))]
    }
    return ans;
}