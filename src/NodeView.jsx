function NodeView({x=0,y=0,onMouseDown,children}) {
	return (
		<div
			className = "node"
			style = {{
				left: `${x}px`,	
				top: `${y}px`,
			}}
			onMouseDown={onMouseDown}
		>
			{children}
		</div>	
	)
}

export default NodeView
