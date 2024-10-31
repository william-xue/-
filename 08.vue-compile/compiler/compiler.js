function tokenizer(input){
    let current = 0;
    let tokens = [];

    while(current < input.length){
        //接下来，不外乎就是边界情况的判断
        let char = input[current];
        //匹配开始标签
        if(char === "<"){
            tokens.push({ type:"tagSymbol",value:char });
            current++;
            continue;
        }
        //如果是空白字符则跳过
        const whitespaceRegExp = /\s/;
        if(whitespaceRegExp.test(char)){
            current++;
            continue;
        }
        // 匹配字母
        const letterRegExp = /[a-zA-Z]/;
        if(letterRegExp.test(char)){
            let value = '';
            while(letterRegExp.test(char)){
                value += char;
                char = input[++current];
            }
            tokens.push({ type:"word",value });
            continue;
        }
        if(char === "@" || char === "="){
            tokens.push({ type:"symbol",value:char });
            current++;
            continue;
        }
        // 匹配字符串
        if(char === '"'){
            let value = '';
            char = input[++current];
            while (char !== '"') {
              value += char;
              char = input[++current];
            }
            char = input[++current];
            tokens.push({ type: 'word', value });
            continue;
        }
        if(char === ">"){
            tokens.push({ type:"tagSymbol",value:char });
            current++;
            continue;
        }
        //如果还匹配到其它字符，则抛出异常
        throw new Error("我不知道这个字符是什么:" + char);
    }

    return tokens;
}
function parser(tokens) {
    let current = 0;
    function walk() {
        let token = tokens[current];
        if (token.type === 'word' && tokens[current - 1].value === '=') {
            current++;
            return {
                type:tokens[current - 3].value,
                value:token.value
            }
        }
        if (token.type === 'tagSymbol' && token.value === '<') {
            token = tokens[++current];
            let node = {
                type: "tag",
                value: token.value,
                event: []
            }
            token = tokens[++current];
            while (token.type !== 'tagSymbol' || (token.type === 'tagSymbol' && token.value !== '>')) {
                if(token.type === 'symbol' || (token.type === 'word' && tokens[current - 1].value === '@')){
                    token = tokens[++current];
                    continue;
                }
                node.event.push(walk());
                token = tokens[current];
            }
            current++;
            return node;
        }
        throw new TypeError(token.type);
    }
    let ast = {
        type: "root",
        children: []
    };
    while (current < tokens.length) {
        ast.children.push(walk());
    }
    return ast;
}
function traverse(ast,visitor){
    /**
     *  循环去遍历
     */
    function traverseArray(array,parent){
        array.forEach(child => traverseNode(child,parent));
    }
    function traverseNode(node,parent){
        let methods = visitor[node.type];
        //创建入口
        if(methods && methods.enter){
            methods.enter(node,parent);
        }
        switch(node.type){
            case "root":
                traverseArray(node.children,node);
                break;
            case "tag":
                traverseArray(node.event,node);
                break;
            case "click":
                break;
            default:
                throw new TypeError(node.type);
        }
        // 创建出口
        if(methods && methods.exit){
            methods.exit(node,parent);
        }
    }
    //从根节点开始，根节点无需对比，所以是null
    traverseNode(ast,null);
}
function transformer(ast) {
    let newAst = {
        type: "root",
        children: []
    };
    ast._context = newAst.children;
    //与观察者做对比
    traverse(ast, {
        click:{
            enter(node,parent){
               parent._context.push({
                   type:"onclick",
                   value:node.value
               })
            }
        },
        tag: {
            enter(node, parent) {
                let DOMNode = {
                    type: "element",
                    defineTag: {
                        type: "tagName",
                        value: node.value
                    },
                    methods: []
                }
                node._context = DOMNode.methods;
                if (DOMNode.type !== 'tag') {
                    DOMNode = {
                        type: "node",
                        value: DOMNode
                    }
                }
                parent._context.push(DOMNode);
            }
        }
    });
    return newAst;
}
function codeGenerator(node){
    switch(node.type){
        case "root":
            return node.children.map(codeGenerator).join("\n");
        case "node":
            return codeGenerator(node.value) + "\n";
        case "element":
            return "<" + node.defineTag.value + " " + node.methods.map(codeGenerator) + ">";
        case "onclick":
            return node.type + '="' + node.value + '"';
        default:
            throw new TypeError(node.type);
    }
}
function compiler(input){
    let tokens = tokenizer(input);
    let ast = parser(tokens);
    let newAst = transformer(ast);
    let output = codeGenerator(newAst);
    return output;
}
