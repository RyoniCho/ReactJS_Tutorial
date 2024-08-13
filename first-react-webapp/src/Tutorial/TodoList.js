import { useState } from "react";

function TodoList()
{
    const [todovalue,setTodo] = useState("")
    const [todolists, setTodoList] =useState([])
    const OnInputChage = (event)=>setTodo(event.target.value);
    const OnSubmit = (event)=>{
        event.preventDefault();
    
        if(todovalue==="")
        return;

        
        setTodoList((currentArray) => [todovalue, ...currentArray])
        setTodo("")
        console.log(todolists)
    };

    return (
        <div>
            <h1>My Todo List</h1>
            <form onSubmit={OnSubmit}>
                <input 
                value={todovalue}
                type="text" 
                placeholder="Type Something to do"
                onChange={OnInputChage}
                />
                <button >Add ToDo</button>

            </form>
            <hr/>
            <ul>
                {todolists.map((item,index) => (<li key={index}>{item}</li>))}
            </ul>
        </div>
    )
 
}
  
export default TodoList;