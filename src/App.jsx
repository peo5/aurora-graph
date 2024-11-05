import { useState, useEffect, useRef } from 'react'
import './App.css'

function NodeView({x=0,y=0,label="a"}) {
	return (
		<div 
			className="node"
			style={{
				left: `${x}px`,	
				top: `${y}px`,
			}}
		>
			{label}
		</div>	
	)
}

function LinkView({x1=0,y1=0,x2=10,y2=10,r=20}) {
	const hypot = Math.hypot(x2-x1,y2-y1)
	const cx = (x2-x1)/hypot
	const cy = (y2-y1)/hypot
	x1 += r*cx
	y1 += r*cy
	x2 -= r*cx
	y2 -= r*cy
	return (
		<line 
			x1={x1} y1={y1} 
			x2={x2} y2={y2} 
			stroke="white" 
			strokeWidth="2px" 
		/>
	)
}

function GraphView({nodes, links}) {

  const [positions, setPositions] = useState(new Map(
		Array.from(nodes, ([key,_],__) => [key,{x:Math.random()*400, y:Math.random()*400}])
	)) 

	const animation = useRef(); 

	const NodeViews = Array.from(nodes, ([key,node],_) => {
		const pos = positions.get(key)
		return (
			<NodeView key={key} x={pos.x} y={pos.y} label={node.label} />
		)
	})

	const LinkViews = Array.from(links, ([key,link],_) => {
		const pos1 = positions.get(link.a)
		const pos2 = positions.get(link.b)
		return (
			<LinkView key={key} x1={pos1.x} y1={pos1.y} x2={pos2.x} y2={pos2.y} r={20} />
		)
	})

	const update = () => { 
		setPositions(positions => { 
			const velocities = new Map(
				Array.from(nodes, ([key,node],id) => [key,{x:0, y:0}])
			) 
			const length = 300
			const strength = 1
			for(const [key,link] of links) {
				const pos1 = positions.get(link.a), pos2 = positions.get(link.b)
				const x1 = pos1.x, y1 = pos1.y
				const x2 = pos2.x, y2 = pos2.y
				const hypot = Math.hypot(x2-x1,y2-y1)
				const cx = (x2-x1)/hypot
				const cy = (y2-y1)/hypot
				const speed = (hypot-length/2)*strength 
				const velocity1 = velocities.get(link.a)
				const velocity2 = velocities.get(link.b)
				// if(key == "l1") console.log("l1 link log", pos1, pos2, x1, y1, x2, y2, hypot, speed, velocity1, velocity2)
				velocity1.x += speed*cx
				velocity1.y += speed*cy
				velocity2.x -= speed*cx
				velocity2.y -= speed*cy
			}
			return new Map(Array.from(positions, ([key,position],_) => {
				const velocity = velocities.get(key)
				// if(key == "n1") console.log("n1 pos",position)
				return [key, {x:position.x + velocity.x/100, y:position.y + velocity.y/100}]
			}))
		})
		animation.current = requestAnimationFrame(update) 
	}

	useEffect(() => {
		animation.current = requestAnimationFrame(update)
		return () => cancelAnimationFrame(animation.current)
	}, [])

  return (
    <div className="graph">
			<div className="node-nest">
				{NodeViews}
			</div>
			<svg className="link-nest">
				{LinkViews}
			</svg>
    </div>
  )
}

function App() {
	const nodes = new Map([
		["n1",{label:"1"}],
		["n2",{label:"2"}],
		["n3",{label:"3"}],
		["n4",{label:"4"}],
		["n5",{label:"5"}],
		["n6",{label:"6"}],
	])
	const links = new Map([
		["l1",{a:"n1", b:"n2"}],
		["l2",{a:"n1", b:"n3"}],
		["l3",{a:"n1", b:"n4"}],
		["l4",{a:"n4", b:"n5"}],
		["l5",{a:"n1", b:"n6"}],
		["l6",{a:"n6", b:"n5"}],
	])
	return (
		<GraphView nodes={nodes} links={links} />
	)
}

export default App
